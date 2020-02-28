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
			var oData = new ODataModel("/sap/opu/odata/SAP/ZMM_SOLCONT_SRV_01/", true);
			oData.read("/GravarContratoJuridicoSet('" + oController.getOwnerComponent().IdSolic + "')", {
				success: function (data) {
					oController.oView.byId("title").setText(parseInt(data.NumSolic) + " - " + data.RazaoSoc);
					oController.getOwnerComponent().RazaoSocial = data.RazaoSoc;
					oController.getOwnerComponent().solicitante = data.Solicitante;
				}.bind(oController)
			});
			oData.read("/ParecerSet?$filter=Numsolic eq '"+oController.getOwnerComponent().IdSolic+"'", {
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
			sap.ui.getCore().byId("Files").setValue("");
			sap.ui.getCore().fileUploadArr = [];
			this.oDialogParecer.close();
		},

		onDialogParecerConfirm: function () {
			//data atual
			var today = new Date();
			var that = this;
			var oParams = new Object();
			oParams = {
				"Seqnr": "",
				"Numsolic": that.getOwnerComponent().IdSolic,
				"RazaoSoc": that.getOwnerComponent().RazaoSocial,
				"UserDe": that.getOwnerComponent().user, //usuário logado
				"UserPara": that.getOwnerComponent().solicitante, //usuário da solicitação
				"DataParecer": today,
				"Mensagem": sap.ui.getCore().byId("inpMensagem").getValue()
			};

			that.oParams = oParams;
			that.sendParecer(that.oParams);

			var newParecer = new TimelineItem({
				dateTime: today,
				text: sap.ui.getCore().byId("inpMensagem").getValue(),
				userName: this.getOwnerComponent().user,
				icon: "sap-icon://post",
				userNameClickable: true
			});
			var oTimeline = this.getView().byId('idTimeline');
			oTimeline.addContent(newParecer);
			this.onDialogClose();
		},

		sendParecer: function (oParams) {
			var oController = this;
			var oModel = new ODataModel("/sap/opu/odata/SAP/ZMM_SOLCONT_SRV_01/");
			var entitySet = "/ParecerSet";
			oModel.create(entitySet, oParams, {
				sucess: function(oResponse){
					oController.onDialogClose();
				}
			});
			

		}

	});
}, /* bExport= */ true);