sap.ui.define([
	"jquery.sap.global",
	"./BaseController",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/model/SimpleType",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/ValidateException",
	"sap/ui/Device",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"com/sap/build/sapcsr/SOLCONT/model/formatter"
], function (jQuery, BaseController, History, MessageBox, ODataModel, Filter, FilterOperator, MessageToast, SimpleType, UIComponent,
	JSONModel, ValidateException, Device, ValueHelpDialog, formatter) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.ContratoJuridico", {
		formatter: formatter,
		sNumSolicitacao: "",

		onInit: function () {
			var oViewModel = new JSONModel({
				isPhone: Device.system.phone
			});

			//define um model para celular
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("contrato").attachPatternMatched(this._onRouteMatched, this);
		},

		//função que copia todos os dados do oData para os campos na tela, e as imagens
		_onRouteMatched: function (oEvent) {
			var oArgs,
				sPath,
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();
			
			this.getView().unbindElement();

			oArgs = oEvent.getParameter("arguments");
			sPath = oArgs.IdSolic;
			if (sPath !== "New") {
				this.sNumSolicitacao = sPath;
				structureApp.solViewModel.enabled = false;
				structureApp.solViewModel.fowardEnabled = true;
				structureAppModel.setData(structureApp);
				
				this.getView().bindElement({
					path: "/GravarContratoJuridicoSet('".concat(sPath).concat("')"),
					parameters: {
						expand: "AnexoSet"
					}
				});
			} else {
				this.sNumSolicitacao ="";
				structureApp.solViewModel.enabled = true;
				structureAppModel.setData(structureApp);
				this.setInitialValues();
			}
		},
		setInitialValues: function () {

			//data atual
			var today = new Date();
			this.byId("dtSolic").setValue(today.toLocaleDateString());

			//Pega os dados de centro de custo e km do usuario logado
			var oView = this.getView(),
				oCentroCusto = oView.byId("inpCentroC"),
				oGerencia = oView.byId("inpGerencia"),
				oBeneficiario = oView.byId("txtSolicitante"),
				oTelefone = oView.byId("txtTelefone"),
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			oBeneficiario.setText("" + structureApp.userData.Nome + "");
			oCentroCusto.setValue("" + structureApp.userData.CentroCusto + "");
			oGerencia.setValue("" + structureApp.userData.Gerencia + "");
			oTelefone.setText("" + structureApp.userData.Telefone + "");

			this.byId("chekCompras").setSelected(false);
			this.byId("checkComplice").setSelected(false);

		},
		/********************************
		 * Valida os campos obrigatórios
		 *********************************/
		_validateForm: function () {
			var isValid = true;

			if (!this._validateField("cmbEmpresa"))
				isValid = false;

			if (!this._validateField("cmbSolicitacao"))
				isValid = false;

			if (!this._validateField("cmbDocumento"))
				isValid = false;

			if (!this._validateField("inpSegundoA"))
				isValid = false;

			if (!this._validateField("inpCentroC"))
				isValid = false;

			if (!this._validateField("inpGerencia"))
				isValid = false;
				
			if(this.getView().byId("chekCompras").getSelected()){

				if (!this._validateField("cmbResponsavel"))
					isValid = false;
			}
			
			if (!this._validateField("inpRazao"))
				isValid = false;

			if (!this._validateField("inpCNPJ"))
				isValid = false;

			if (!this._validateField("txtADescricao"))
				isValid = false;

			return isValid;
		},

		_validateField: function (fieldName) {

			var oControl = this.getView().byId(fieldName);
			var value;

			if (fieldName.substring(0, 3) === "sel") {
				value = oControl.getSelectedKey();
				if (value === "") {
					oControl.setValueState("Error");
					oControl.setValueStateText(this.geti18nText("campo_obrigatorio_txt"));
					MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
					return false;
				}
			} else {
				value = oControl.getValue();
				if (value === "") {
					oControl.setValueState("Error");
					oControl.setValueStateText(this.geti18nText("campo_obrigatorio_txt"));
					MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
					return false;
				}
			}
			oControl.setValueState("None");
			return true;
		},

		/***********************
		 *  Envia solicitação 
		 ************************/

		onSubmit: function () {
			var oView = this.getView();
			var oParams = new Object();
			var that = this;
			var today = new Date();
			var oValor = oView.byId("inpValor");
			var listaUpload = this.getView().byId("UploadCollection");
			var aArquivos = sap.ui.getCore().fileUploadArr;
			var aFiles = new Array();
			var oArquivo;
			var oFiles = new Array();

			if (this._validateForm()) {

				//anexos
				jQuery.each(aArquivos, function (i, oFile) {

					oArquivo = {
						"Idanexo": "00",
						"Zfilename": oFile.FileName,
						"Zfiletype": oFile.MimeType,
						"Zcontents": oFile.Content,
						"Numsolic": "000"
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
					"NumSolic": this.sNumSolicitacao,
					"DtSolic": oView.byId("dtSolic").getDateValue(),
					"Empresa": oView.byId("cmbEmpresa").getValue(),
					"TpSolic": oView.byId("cmbSolicitacao").getValue(),
					"TpDoc": oView.byId("cmbDocumento").getValue(),
					"DescSolic": oView.byId("txtADes").getValue(),
					"NContrato": oView.byId("inpNContrato").getValue(),
					"NRc": oView.byId("inpNRC").getValue(),
					"SegApr": oView.byId("inpSegundoA").getValue(),
					"Solicitante": oView.byId("txtSolicitante").getText(),
					"Telefone": oView.byId("txtTelefone").getText().trim(),
					"CCusto": oView.byId("inpCentroC").getValue(),
					"Gerencia": oView.byId("inpGerencia").getValue(),
					"RespCompras": oView.byId("cmbResponsavel").getValue(),
					"RazaoSoc": oView.byId("inpRazao").getValue(),
					"CnpjCpf": oView.byId("inpCNPJ").getValue(),
					"DescContratacao": oView.byId("txtADescricao").getValue(),
					"Status": "",
					"Situacao": "",
					"SendCompras": "",
					"SendComplice": "",
					"Valor": oValor.getValue() ? (oValor.data("convertedValue") ? oValor.data("convertedValue") : oValor.getValue().replace(",", ".")) : "0.00",
					"AnexoSet": aFiles,
					"NumAdvogado": "",
					"IdEmpresa": oView.byId("cmbEmpresa").getSelectedKey(),
					"IdTipoSol": oView.byId("cmbSolicitacao").getSelectedKey(),
					"IdTipoDoc": oView.byId("cmbDocumento").getSelectedKey(),
				};

				that.oParams = oParams;
				that.sendSolicitacao(that.oParams);

			}
		},

		sendSolicitacao: function (oParams) {
			this.getOwnerComponent().showBusyIndicator();
			var that = this,
				oModel = this.getModel(),
				entitySet = "/GravarContratoJuridicoSet";
			
			oModel.create(entitySet, oParams, {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("solicitacao_sucesso_msg"));
					that.getOwnerComponent().hideBusyIndicator();
					//that.onCancel();
					oModel.refresh();
					if(that.sNumSolicitacao === ""){
						if(oData.NumSolic !== ""){
							that.readSolicitacao(oData.NumSolic);
						}
					}
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("solicitacao_erro"));
					that.getOwnerComponent().hideBusyIndicator();
					oModel.refresh(true);
				}
			});
			
		},
		
		readSolicitacao: function (sPath){
			
			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();
			
			structureApp.solViewModel.enabled = false;
			structureAppModel.setData(structureApp);
			
			this.getView().bindElement({
					path: "/GravarContratoJuridicoSet('".concat(sPath).concat("')"),
					parameters: {
						expand: "AnexoSet"
					}
				});
		},

		/***********************
		 *  Quando clica em CANCELAR solicitação 
		 ************************/

		onCancel: function () {
			var oView = this.getView();
			var oEmpresa = oView.byId("cmbEmpresa");
			var oTPSolic = oView.byId("cmbSolicitacao");
			var oTPDoc = oView.byId("cmbDocumento");
			var oDesc = oView.byId("txtADes");
			var oValor = oView.byId("inpValor");
			var oContrato = oView.byId("inpNContrato");
			var oRC = oView.byId("inpNRC");
			var oSegundoA = oView.byId("inpSegundoA");
			var oCC = oView.byId("inpCentroC");
			var oGerencia = oView.byId("inpGerencia");
			var oResponsavel = oView.byId("cmbResponsavel");
			var oRazaoSocial = oView.byId("inpRazao");
			var oCNPJ = oView.byId("inpCNPJ");
			var oDescContratacao = oView.byId("txtADescricao");

			oEmpresa.setValue("");
			oTPSolic.setValue("");
			oTPDoc.setValue("");
			oDesc.setValue("");
			oValor.setValue("");
			oContrato.setValue("");
			oRC.setValue("");
			oSegundoA.setValue("");
			oCC.setValue("");
			oGerencia.setValue("");
			oResponsavel.setValue("");
			oRazaoSocial.setValue("");
			oCNPJ.setValue("");
			oDescContratacao.setValue("");

			//anexos
			var oUploadCollection = oView.byId('UploadCollection'),
				aItems = oUploadCollection.getItems();

			jQuery.each(aItems, function (i, oItem) {
				oUploadCollection.removeItem(oItem);
				oUploadCollection.destroyItems(oItem);
			});

			sap.ui.getCore().fileUploadArr = undefined;

		},

		/***********************
		 *  converte o campo valor em moeda 
		 ************************/
		currency: function (oEvent, oValor) {
			var oInput = oEvent !== "" ? oEvent.getSource() : oValor;
			var sValor = oInput.getValue();

			sValor = sValor.split(",").join("");
			var sArray = sValor.split("");

			if (isNaN(parseInt(sValor[sValor.length - 1]))) {
				sArray.pop();
			}
			var sValorNovo = "";
			if (sArray[0] === "0") {
				if (sArray[1] === "0") {
					sArray.shift(0);
				}
				sArray.shift(0);
			}
			if (sArray.length > 2) {
				for (var i = 0; i < sArray.length - 2; i++) {
					sValorNovo += sArray[i];
				}
				sValorNovo += "," + sArray[sArray.length - 2] + sArray[sArray.length - 1];
				if (sValorNovo[0] === ",") {
					var aNovoValor;
					for (var i; i < sValorNovo.length; i++) {
						if (i === 0) {
							aNovoValor[0] = "0";
						} else {
							aNovoValor[i] = sValorNovo[i - 1];
						}
					}
					aNovoValor.push(sValorNovo[sValorNovo.length - 1]);
					sValorNovo = aNovoValor;
				}

				oInput.setValue(sValorNovo);
			} else {
				if (sArray.length === 1) {
					oInput.setValue("0,0" + sArray[0]);
				} else {
					if (sArray.length > 0) {
						oInput.setValue("0," + sArray[0] + sArray[1]);
					} else {
						oInput.setValue("0,00");
					}
				}
			}
		},

		/********************************************
		 *   DIALOG PARA SELEÇÃO DE CENTRO DE CUSTO
		 **********************************************/

		getDialogCentroCusto: function (sFragment) {
			if (!this._oDialogCC) {
				this._oDialogCC = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogCC);
			}

			return this._oDialogCC;
		},

		_onOpenDialogCC: function () {
			var oView = this.getView();
			var oOwnerComponent = this.getOwnerComponent();
			var oController = this;
			this.oDialogCentroCusto = this.getDialogCentroCusto("com.sap.build.sapcsr.SOLCONT.view.fragments.CentroCusto");
			oOwnerComponent.showBusyIndicator();
			if (!oView.getModel("CentroCustos")) {
				oOwnerComponent.showBusyIndicator();
				$.ajax({
					url: "/sap/opu/odata/SAP/ZTRIP_SRV/ET_CENTROS_CUSTOSet?$format=json",
					success: function (oResponse) {
						oController.oCentroCusto = oResponse.d;
						var oModel = new JSONModel(oController.oCentroCusto);
						oView.setModel(oModel, "centroCusto");
						oOwnerComponent.hideBusyIndicator();
						oController.oDialogCentroCusto.open();
					},
					error: function (oResponse) {
						oOwnerComponent.hideBusyIndicator();
						oController._oCentroCustoModalDialog.open();
						oOwnerComponent._genericErrorMessage(oController.geti18nText("centro_custo_error_load_msg"));
					},
					type: 'GET'
				});
			} else {
				this.oDialogCentroCusto.open();
			}

		},

		_onDialogCCClose: function () {
			this.oDialogCentroCusto.close();
		},

		_onTableItemCCPress: function (oEvent) {
			var oController = this;
			var oCC = this.getView().byId("inpCentroC");
			var odesc = this.getView().byId("inpGerencia");
			var aContexts = oEvent.getParameter("selectedContexts");
			var centroCustoId = aContexts.map(function (oContext) {
				return oContext.getObject();
			});
			var oTextCC = oController.formatter.textName(centroCustoId[0].Ltext);
			oCC.setValue(centroCustoId[0].Kostl);
			odesc.setValue(oTextCC);
		},

		_onSearchCC: function (oEvent) {
			var sQuery = oEvent.getParameter("query");

			var oFilter = new Filter({
				filters: [
					new Filter("Ltext", sap.ui.model.FilterOperator.Contains, sQuery),
					new Filter("Kostl", sap.ui.model.FilterOperator.Contains, sQuery)
				]
			});
			var oTbl = sap.ui.getCore().byId("tblCentroCusto");
			var oBinding = oTbl.getBinding("items");
			oBinding.filter([oFilter]);
		},

		/*****************************************************************
		 * Exclui o texto de gerencia se o input Centro de custo for modificado
		 ******************************************************************/
		_onChangeCC: function (oEvent) {
			var oController = this,
				oView = oController.getView(),
				oInput = oEvent.getSource();

			var descricaoCC = oView.byId("inpGerencia");

			if (oInput) {
				descricaoCC.setValue("");
				// oInput.setValueStateText("Entre com um Centro de Custo válido");
				// oInput.setValueState("Warning");
			}
		},

		/***************************************************************
		 * Abrir Value Help de contrato
		 * @param {object} [oEvent] 
		 **************************************************************/
		openDialogContrato: function (oEvent) {
			var that = this;
			var oModel = this.getView().getModel();
			var oValueHelpDialog = new ValueHelpDialog({
				title: this.geti18nText("busca_contrato_txt"),
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				key: "ContratoCodigo", 
				descriptionKey: "ContratoNome", 
				// Seleciona o item
				ok: function (oControlEvent) {
					var key = oControlEvent.getParameter("tokens")[0].getKey();
					oValueHelpDialog.close();
				},

				cancel: function (oControlEvent) {
					oValueHelpDialog.close();
				},
				afterClose: function () {
					oValueHelpDialog.destroy();
				}
			});

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: [{
					label: this.geti18nText("num_solicitacao_lbl"),
					template: "solicitacao"
				}, {
					label: this.geti18nText("num_contrato_lbl"),
					template: "contrato"
				}, {
					label: this.geti18nText("razao_social_txt"),
					template: "RS"
				}, {
					label: this.geti18nText("cnpj_cpf_lbl"),
					template: "cnpjcpf"
				}]
			});
			oValueHelpDialog.getTable().setModel(oColModel, "columns");
			// var aFilters = [ new Filter("Empresa", FilterOperator.EQ, oEmpresa)];

			// oValueHelpDialog.getTable().setModel(oModel);
			// if (oValueHelpDialog.getTable().bindRows) {
			// 	oValueHelpDialog.getTable().bindRows({path: "/AreaSet", filters: aFilters});
			// }
			// if (oValueHelpDialog.getTable().bindItems) {
			// 	var oTable = oValueHelpDialog.getTable();

			// 	oTable.bindAggregation("items", "/AreaSet", function (sId, oContext) {
			// 		var aCols = oTable.getModel("columns").getData().cols;

			// 		return new sap.m.ColumnListItem({
			// 			cells: aCols.map(function (column) {
			// 				var colname = column.template;
			// 				return new sap.m.Label({
			// 					text: "{" + colname + "}"
			// 				});
			// 			})
			// 		});
			// 	});
			// }

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				filterBarExpanded: true,
				useToolbar: false,
				showGoOnFB: true,
				showRestoreOnFB: false,
				showClearOnFB: false,
				showFilterConfiguration: false,
				showRestoreButton: false,
				showClearButton: false,

				filterItems: [new sap.ui.comp.filterbar.FilterItem({
						name: "fiContrato",
						label: this.geti18nText("contrato_lbl"),
						control: new sap.m.Input("inFbContrato", {
							type: "Text"
						})
					}),
					new sap.ui.comp.filterbar.FilterItem({
						name: "fiNSolic",
						label: this.geti18nText("num_solicitacao_lbl"),
						control: new sap.m.Input("inFbNSolic", {
							type: "Text"
						})
					}),
					new sap.ui.comp.filterbar.FilterItem({
						name: "fiCNPJCPF",
						label: this.geti18nText("cnpj_cpf_lbl"),
						control: new sap.m.Input("inFbCnpjcpf")
					})

				],
				// Busca
				search: function (oEvent) {
					var ccusto = oEvent.getParameter("selectionSet")[0].getValue();
					var gerencia = oEvent.getParameter("selectionSet")[1].getValue();
					var gerente = oEvent.getParameter("selectionSet")[2].getValue();

					var oTable = oValueHelpDialog.getTable();
					var oBinding = oTable.getBinding("rows");

					var oFilters = [];
					if (ccusto != "")
						oFilters.push(new Filter("CentroCusto", FilterOperator.EQ, ccusto));

					if (gerencia != "")
						oFilters.push(new Filter("AreaNome", FilterOperator.EQ, gerencia));

					if (gerente != "")
						oFilters.push(new Filter("GerenteNome", FilterOperator.EQ, gerente));
					oBinding.filter(oFilters);

				}
			});

			oValueHelpDialog.setFilterBar(oFilterBar);

			oValueHelpDialog.open();
			oValueHelpDialog.update();

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
		
		handleShowFile: function(oEvent){
		
			//pega o conteúdo do arquivo
			var fname = oEvent.getSource().getFileName(),
				ftype = oEvent.getSource().getMimeType(),
				oContext = oEvent.getSource().getBindingContext(),
				oFile = this.getModel().getObject(oContext.getPath());

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

		fnFileDeleted: function () {
			var oSelectedModel = this.getSelected();

		},

		checkCompra: function (oEvent) {
			var oSelecionado = oEvent.getSource();
			var respCompras = this.getView().byId("cmbResponsavel");

			if (oSelecionado.getSelected() === true) {
				respCompras.setEnabled(true);
			} else {
				respCompras.setEnabled(false);
				respCompras.setValue("");
			}
		},

		/********************************************
		 *   DIALOG PARA SELEÇÃO DE Aprovador
		 **********************************************/

		getDialogAprovador: function (sFragment) {
			if (!this._oDialogAprovador) {
				this._oDialogAprovador = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogAprovador);
			}

			return this._oDialogAprovador;
		},

		_onOpenDialogAprovador: function () {
			var oView = this.getView();
			var oOwnerComponent = this.getOwnerComponent();
			var oController = this;
			this.oDialogAprovadores = this.getDialogAprovador("com.sap.build.sapcsr.SOLCONT.view.fragments.Aprovadores");
			oOwnerComponent.showBusyIndicator();
			if (!oView.getModel("aprovador")) {
				oOwnerComponent.showBusyIndicator();
				$.ajax({
					url: "/sap/opu/odata/SAP/ZMM_SOLCONT_SRV_01/GestoresSet?$format=json",
					success: function (oResponse) {
						oController.oAprovadores = oResponse.d;
						var oModel = new JSONModel(oController.oAprovadores);
						oView.setModel(oModel, "aprovadores");
						oOwnerComponent.hideBusyIndicator();
						oController.oDialogAprovadores.open();
					},
					error: function (oResponse) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(oController.geti18nText("aprovadores_load_erro_msg"));
					},
					type: 'GET'
				});
			} else {
				this.oDialogAprovadores.open();
			}

		},

		_onDialogAprClose: function () {
			this.oDialogAprovadores.close();
		},

		_onTableItemAprPress: function (oEvent) {
			var oController = this;
			var oCampoApr = oController.getView().byId("inpSegundoA");
			var aContexts = oEvent.getParameter("selectedContexts");
			var beneficiarioId = aContexts.map(function (oContext) {
				return oContext.getObject();
			});
			var aprovador = oController.formatter.textName(beneficiarioId[0].Nome);
			oCampoApr.setValue(aprovador);
		},

		_onSearchApr: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"Nome",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

	});
});