sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/suite/ui/commons/TimelineItem",
	"com/sap/build/sapcsr/SOLCONT/model/formatter"
], function (BaseController, MessageBox, History, ValueHelpDialog, Filter, FilterOperator, ODataModel, JSONModel, Device, TimelineItem,
	formatter) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.Parecer", {
		formatter: formatter,

		onInit: function () {
			//dialogs
			this.oDialogParecer = this.getDialogCancel("com.sap.build.sapcsr.SOLCONT.view.fragments.NovoParecer");

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Parecer").attachDisplay(jQuery.proxy(this._onRouteMatched, this));

			//limpa a timeline 
			// var oTimeline = this.getView().byId('idTimeline');
			// oTimeline.removeAllContent();
		},

		_onRouteMatched: function (oEvent) {
			var oController = this;
			var idPage = this.getRouter()._oRouter._prevMatchedRequest.split("/")[1];
			oController.getOwnerComponent().IdSolic = idPage;
			//	var oData = new ODataModel("/sap/opu/odata/SAP/ZMM_SOLCONT_SRV_01/", true);
			var oData = this.getModel();
			oData.read(oData.createKey("/GravarContratoJuridicoSet", {
				NumSolic: oController.getOwnerComponent().IdSolic
			}), {
				success: function (data) {
					oController.oView.byId("title").setText(parseInt(data.NumSolic, 10) + " - " + data.RazaoSoc);
					oController.getOwnerComponent().RazaoSocial = data.RazaoSoc;
					oController.getOwnerComponent().solicitante = data.Solicitante;
				}.bind(oController)
			});
			//oData.read("/ParecerSet?$filter=Numsolic eq '"+oController.getOwnerComponent().IdSolic+"'", {
			oData.read("/ParecerSet", {
				filters: [new sap.ui.model.Filter("Numsolic", "EQ", oController.getOwnerComponent().IdSolic)],
				success: function (data) {
					var oModel = new sap.ui.model.json.JSONModel(data);
					oController.getView().setModel(oModel, "pareceres");
				}.bind(oController)
			});

		},

		getDialogCancel: function (oEvent) {
			if (!this._oDialogParecer) {
				this._oDialogParecer = sap.ui.xmlfragment("com.sap.build.sapcsr.SOLCONT.view.fragments.DialogParecer", this);
				this.getView().addDependent(this._oDialogParecer);
			}
			return this._oDialogParecer;

		},

		onOpenDialogParecer: function () {
			this.oDialogParecer.open();
		},

		onDialogClose: function () {
			sap.ui.getCore().byId("inpMensagem").setValue("");
			//sap.ui.getCore().byId("Files").setValue("");
			sap.ui.getCore().fileUploadArr = [];
			this.oDialogParecer.close();
		},

		/*ANEXOS*/
		// When user select the file then this method will call....
		handleSelectFile: function (oEvent) {
			var fileDetails = oEvent.getParameters("file").files[0];
			if (sap.ui.getCore().fileUploadArr === undefined)
				sap.ui.getCore().fileUploadArr = [];
			if (fileDetails) {
				var mimeDet = fileDetails.type,
					fileName = fileDetails.name;

				// Calling method....
				this.base64coonversionMethod(mimeDet, fileName, fileDetails, "001");
			} else {
				sap.ui.getCore().fileUploadArr = [];
			}
		},

		// Base64 conversion of selected file(Called method)....
		base64coonversionMethod: function (fileMime, fileName, fileDetails, DocNum) {
			var that = this;
			if (!FileReader.prototype.readAsBinaryString) {
				FileReader.prototype.readAsBinaryString = function (fileData) {
					var binary = "";
					var reader = new FileReader();
					reader.onload = function (e) {
						var bytes = new Uint8Array(reader.result);
						var length = bytes.byteLength;
						for (var i = 0; i < length; i++) {
							binary += String.fromCharCode(bytes[i]);
						}
						that.base64ConversionRes = btoa(binary);
						sap.ui.getCore().fileUploadArr.push({
							"DocumentType": DocNum,
							"MimeType": fileMime,
							"FileName": fileName,
							"Content": that.base64ConversionRes
						});
					};
					reader.readAsArrayBuffer(fileData);
				};
			}
			var reader = new FileReader();
			reader.onload = function (readerEvt) {
				var binaryString = readerEvt.target.result;
				that.base64ConversionRes = btoa(binaryString);
				sap.ui.getCore().fileUploadArr.push({
					"DocumentType": DocNum,
					"MimeType": fileMime,
					"FileName": fileName,
					"Content": that.base64ConversionRes,

				});
			};
			reader.readAsBinaryString(fileDetails);
		},

		handleShowFile: function (oEvent) {

			//pega o conteúdo do arquivo
			var fname = oEvent.getSource().getFileName(),
				ftype = oEvent.getSource().getMimeType(),
				oContext = oEvent.getSource().getBindingContext(),
				oFile;
			if (oContext){
				oFile = this.getModel().getObject(oContext.getPath());
			}
			else{
				var oSelContext = oEvent.getSource().oBindingContexts.parecerAnexo;
				oFile = this.getModel("parecerAnexo").getObject(oSelContext.sPath);
			}
			
			var base64str = oFile.Zcontents;

			// decode base64 string, remove space for IE compatibility
			var binary = atob(base64str.replace(/\s/g, ''));
			var len = binary.length;
			var buffer = new ArrayBuffer(len);
			var view = new Uint8Array(buffer);
			for (var i = 0; i < len; i++) {
				view[i] = binary.charCodeAt(i);
			}

			// create the blob object with content-type "application/pdf"               
			var blob = new Blob([view], {
				type: ftype
			});

			var url = URL.createObjectURL(blob);

			window.open(url, '_blank');
		},

		fnFileDeleted: function (oEvent) {
			var that = this,
				sMsg = "",
				oModel = this.getModel(),
				oContext = oEvent.getSource().getBindingContext(),
				oFile = this.getModel().getObject(oContext.getPath());

			if (oFile) {

				sap.m.MessageBox.warning(
					this.geti18nText1("confirm_excluir_file", [oFile.Zfilename]), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
						onClose: function (sAction) {
							if (sAction === sap.m.MessageBox.Action.YES) {
								that.showBusy();
								oModel.remove(oModel.createKey("/AnexoSet", {
									Numsolic: oFile.Numsolic,
									Idanexo: oFile.Idanexo
								}), {
									success: function (oData) {
										that.hideBusy();
										sMsg = that.geti18nText("arquivo_excluido_sucess_msg");
										that.getOwnerComponent()._genericSuccessMessage(sMsg);
									},
									error: function (oError) {
										that.hideBusy();
										sMsg = that.geti18nText("arquivo_excluido_error_msg");
										that.getOwnerComponent()._genericErrorMessage(sMsg);
									}
								});
							}
						}
					}
				);

			}

		},

		onPressAttachList: function (oEvent) {
			// create popover
			var oAppModel = this.getModel("structureApp"),
				oParAnexosM = oAppModel.getProperty("/parecerAnexo");
				oParAnexosM.isBusy = true;
				oAppModel.refresh();
				
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("com.sap.build.sapcsr.SOLCONT.view.fragments.AnexosParecer", this);
				this.getView().addDependent(this._oPopover);
			}
			var that = this,
				oTimelineItem = oEvent.getSource().getParent().getParent(),
				sPath = oTimelineItem.oBindingContexts.pareceres.sPath,
				oModel = this.getModel(),
				oSelItem = this.getModel("pareceres").getObject(sPath);
				
				var aFilter = new Filter([]),
				oFilter = {};

			oFilter = new Filter("Numparec", sap.ui.model.FilterOperator.EQ, oSelItem.Seqnr );
			aFilter.aFilters.push(oFilter);
			oFilter = new Filter("Numsolic", sap.ui.model.FilterOperator.EQ, oSelItem.Numsolic);
			aFilter.aFilters.push(oFilter);

			oModel.read("/AnexoSet", {
				filters: aFilter.aFilters,
				success: function (oData) {

					var oJsModel = new JSONModel(oData);
					that.getView().setModel(oJsModel, "parecerAnexo");
					oParAnexosM.isBusy = false;
					oAppModel.refresh();
				},
				error: function (oError) {
					oParAnexosM.isBusy = false;
					oAppModel.refresh();
				}
			});

			this._oPopover.openBy(oEvent.getSource());
		},

		onCancelPopover: function (oEvent) {
			this._oPopover.close();
		},

		onDialogParecerConfirm: function () {
			//data atual
			var today = new Date(),
				that = this,
				oParams = new Object(),
				listaUpload = sap.ui.getCore().byId("parecerUploadCollection"),
				aArquivos = sap.ui.getCore().fileUploadArr,
				aFiles = new Array(),
				oArquivo,
				oFiles = new Array();

			//anexos
			jQuery.each(aArquivos, function (i, oFile) {

				oArquivo = {
					"Idanexo": "00",
					"Zfilename": oFile.FileName,
					"Zfiletype": oFile.MimeType,
					"Zcontents": oFile.Content,
					"Numsolic": "000",
					"Numparec": "000"
				};
				oFiles.push(oArquivo);
			});

			if (listaUpload.getItems().length !== oFiles.length) {

				for (var j = 0; j < listaUpload.getItems().length; j++) {
					aFiles.push(...oFiles.filter(function (arquivo) {
						return arquivo.Zfilename === listaUpload.aItems[j].getFileName();
					}));
				}
			}

			if (aFiles.length === 0) {
				aFiles = oFiles;
			}

			oParams = {
				"Seqnr": "",
				"Numsolic": that.getOwnerComponent().IdSolic,
				"RazaoSoc": that.getOwnerComponent().RazaoSocial,
				"UserDe": that.getOwnerComponent().user, //usuário logado
				"UserPara": that.getOwnerComponent().solicitante, //usuário da solicitação
				"DataParecer": today,
				"Mensagem": "",
				"AnexoSet": aFiles,
				"ParecerTextosSet": [{
					"Seqnr": "",
					"NumSolic": that.getOwnerComponent().IdSolic,
					"Texto": sap.ui.getCore().byId("inpMensagem").getValue()
				}]
			};

			that.oParams = oParams;
			that.sendParecer(that.oParams);

			/*var newParecer = new TimelineItem({
				dateTime: today,
				text: sap.ui.getCore().byId("inpMensagem").getValue(),
				userName: this.getOwnerComponent().user,
				icon: "sap-icon://post",
				userNameClickable: true
			});
			var oTimeline = this.getView().byId('idTimeline');
			oTimeline.addContent(newParecer);*/
			this.onDialogClose();
		},

		sendParecer: function (oParams) {
			var oController = this;
			//var oModel = new ODataModel("/sap/opu/odata/SAP/ZMM_SOLCONT_SRV_01/");
			var oModel = this.getModel();
			var entitySet = "/ParecerSet";

			oController.getOwnerComponent().showBusyIndicator();

			oModel.create(entitySet, oParams, {
				success: function (oResponse) {
					var sMessage = oController.geti18nText("parecer_sucesso_msg");

					oController.getOwnerComponent().hideBusyIndicator();
					oController.getOwnerComponent()._genericSuccessMessage(sMessage);
					oController.onDialogClose();
					oController._onRouteMatched(this);
					
				},
				error: function (oError) {
					var sErrorMessage = oController.geti18nText("parecer_erro_msg");
					oController.getOwnerComponent().hideBusyIndicator();
					oController.getOwnerComponent()._genericErrorMessage(sErrorMessage);
				}
			});
		}

	});
}, /* bExport= */ true);