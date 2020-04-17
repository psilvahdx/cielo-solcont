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

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.HistoricoParecer", {
		formatter: formatter,

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("historicoParecer").attachDisplay(jQuery.proxy(this._onRouteMatched, this));
		},

		_onRouteMatched: function (oEvent) {
		
		},
		
		onSearchParecer: function(oEvent){
			var sValue = oEvent.getParameter("query"),
				oData = this.getModel(),
				that = this;
				
			var aFilter = new Filter({
				filters:[
					new Filter("Numsolic", sap.ui.model.FilterOperator.EQ, sValue)//,
					//new Filter("RazaoSoc", sap.ui.model.FilterOperator.Contains, sValue)
					]//,
				//and: false
			});
			
			oData.read("/ParecerSet", {
				filters: [aFilter],
				success: function (data) {
					var oModel = new sap.ui.model.json.JSONModel(data);
					that.getView().setModel(oModel, "pareceres");
				}.bind(that)
			});
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

			//window.open(url, '_blank');
			this.forceDownload(url,fname);
		},
		
		forceDownload: function(blob, filename) {
			var a = document.createElement('a');
			a.download = filename;
			a.href = blob;
			// For Firefox https://stackoverflow.com/a/32226068
			document.body.appendChild(a);
			a.click();
			a.remove();
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
		}
		
	});
}, /* bExport= */ true);