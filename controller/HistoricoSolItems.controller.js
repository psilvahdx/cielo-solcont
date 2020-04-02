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
	"com/sap/build/sapcsr/SOLCONT/model/formatter"
], function (BaseController, MessageBox, History, ValueHelpDialog, Filter, FilterOperator, ODataModel, JSONModel, Device,
	formatter) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.HistoricoSolItems", {
		formatter: formatter,

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("historicoSolItems").attachDisplay(jQuery.proxy(this._onRouteMatched, this));
		},

		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("data");
			if(oArgs){
				this.searchHistItems(oArgs.IdSol);
			}
		},
		
		searchHistItems: function(sValue){
			var oData = this.getModel(),
				that = this;
				
			var aFilter = new Filter({
				filters:[
					new Filter("NumSolic", sap.ui.model.FilterOperator.EQ, sValue)
					]
			});
			
			oData.read("/HistoricoSolicitacaoSet", {
				filters: [aFilter],
				success: function (data) {
					var oModel = new sap.ui.model.json.JSONModel(data);
					that.getView().setModel(oModel, "histSolItems");
				}.bind(that)
			});
		},
		
		onCancel: function(oEvent){
			this.getRouter().navTo("historicoSolicitacao");
		},
		
		handleSituacaoPopoverPress: function(oEvent){
			
			var oContext = oEvent.getSource().getBindingContext(),
				oObject = this.getModel().getObject(oContext.getPath()),
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				sText = "";		
				
				switch(oObject.Status){
				
					case "01":
						sText = "aguardando_def_advogado_txt";
						break;
					case "02":
						sText = "em_analise_txt";
						break;
					case "03":
						sText = "advogado_def_txt";
						break;
					case "04":
						sText = "parecer_enviado_txt";
						break;
					case "05":
						sText = "analisando_parecer_txt";
						break;
					case "06":
						sText = "aguardando_assinatura_txt";
						break;
					case "07":
						sText = "aguardando_aprov_ger_txt";
						break;
					case "08":
						sText = "rejeit_ressalv_txt";
						break;
					case "09":
						sText = "rejeit_ressalv_sem_aprov_txt";
						break;
					case "10":
						sText = "aguar_aprov_compr_txt";
						break;
					case "11":
						sText = "aprovada_txt";
						break;
					case "12":
						sText = "cancelada_txt";
						break;
					case "13":
						sText = "finalizada_txt";
						break;
					case "14":
						sText = "recusada_txt";
						break;
					default: 
						sText = "em_aberto_txt";
						break;
				}
				
				structureApp.situacaoText.text = this.geti18nText(sText);
				structureAppModel.refresh();
			
			// create popover
			if (!this._oSituacaoPopover) {
				this._oSituacaoPopover = sap.ui.xmlfragment("com.sap.build.sapcsr.SOLCONT.view.fragments.Situacao", this);
				this.getView().addDependent(this._oSituacaoPopover);
			}
			this._oSituacaoPopover.openBy(oEvent.getSource());
		}
	});
});