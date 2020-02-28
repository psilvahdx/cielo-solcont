sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/odata/ODataModel"
], function (Controller, UIComponent, ODataModel) {
	"use strict";

	return Controller.extend("com.sap.build.sapcsr.SOLCONT.controller.BaseController", {

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		
		getResourceBundle: function() {
			return this.getModel("i18n").getResourceBundle();
		},
		
		geti18nText: function(key){
			if(this.getResourceBundle()){
				return this.getResourceBundle().getText(key);
			}
			else{
				return null;
			}
		},
		
		geti18nText1: function(k, r){
			if(this.getResourceBundle()){
				return this.getResourceBundle().getText(k, r);
			}
			else{
				return null;
			}
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getDialog: function (sFragment) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialog);
			}

			return this._oDialog;
		},

		getUserData: function (oParams) {

			var oModel = this.getModel(),
				that = this,
				structureAppModel = this.getModel("structureApp");

			oModel.read("/UsuarioPerfilSet('')", {
				success: function (oData) {
					var structureApp = structureAppModel.getData();
					structureApp.userData.IdUser = oData.IdUsuario;
					structureApp.userData.Perfil = oData.Perfil;
					structureApp.userData.Nome = that.getOwnerComponent().user;
					structureApp.userData.CentroCusto = that.getOwnerComponent().CentroCusto;
					structureApp.userData.Gerencia = that.getOwnerComponent().Gerencia;
					structureApp.userData.Telefone = that.getOwnerComponent().Telefone.trim();
					structureAppModel.setData(structureApp);
					that.getView().setModel(structureAppModel, "usrData");

					if (oData.Perfil === "ADMIN") {
						var oSideModel = that.getModel("side"),
							oSideData = oSideModel.getData();

						for (var i = 0; i < oSideData.navigation.length; i++) {
							if (oSideData.navigation[i].title === "Administrador") {
								oSideData.navigation[i].visible = true;
								break;
							}
						}
						oSideModel.setData(oSideData);
					}

				},
				error: function (oError) {

				}
			});

		},

		onCloseDialog: function (oEvent) {
			oEvent.getSource().getParent().close();
		}
	});

});