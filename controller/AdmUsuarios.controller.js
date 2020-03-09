sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"com/sap/build/sapcsr/SOLCONT/model/formatter"
], function (BaseController, MessageBox, ODataModel, Filter, FilterOperator, MessageToast,
	JSONModel, Device, ValueHelpDialog, formatter) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.AdmUsuarios", {
		formatter: formatter,

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
			this.oRouter.getRoute("usersAdm").attachPatternMatched(this._onRouteMatched, this);
		},

		//função que copia todos os dados do oData para os campos na tela, e as imagens
		_onRouteMatched: function (oEvent) {
			var that = this,
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			this.getView().bindElement({
				path: "/UsuarioPerfilSet",
				events: {
					dataReceived: function (oEvent) {
						that.hideBusy();
					}
				}
			});
		},
		
		buildFilters: function (oFilterAdmUser) {

			var aFilter = new Filter([]),
				oFilter = {};

			if (oFilterAdmUser.idUser) {
				oFilter = new Filter("IdUsuario", sap.ui.model.FilterOperator.EQ, oFilterAdmUser.idUser);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterAdmUser.nome) {
				oFilter = new Filter("Nome", sap.ui.model.FilterOperator.EQ, oFilterAdmUser.nome);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterAdmUser.perfil) {
				oFilter = new Filter("Perfil", sap.ui.model.FilterOperator.EQ, oFilterAdmUser.perfil);
				aFilter.aFilters.push(oFilter);
			}

			return aFilter;
		},
	
		onSearch: function(oEvent){
			
			var filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbUsers"),
				oBinding = oTable.getBinding("items"),
				oFilterUsers = filterModel.getProperty("/admUsers"),
				aFilter = this.buildFilters(oFilterUsers);
				
				oBinding.filter(aFilter.aFilters);
			
		}
	});
});