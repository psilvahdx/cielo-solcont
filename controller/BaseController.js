sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/odata/ODataModel",
	"sap/m/MessageBox"
], function (Controller, UIComponent, ODataModel, MessageBox) {
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

		getResourceBundle: function () {
			return this.getModel("i18n").getResourceBundle();
		},

		geti18nText: function (key) {
			if (this.getResourceBundle()) {
				return this.getResourceBundle().getText(key);
			} else {
				return null;
			}
		},

		geti18nText1: function (k, r) {
			if (this.getResourceBundle()) {
				return this.getResourceBundle().getText(k, r);
			} else {
				return null;
			}
		},

		showBusy: function () {
			this.getOwnerComponent().showBusyIndicator();
		},

		hideBusy: function () {
			this.getOwnerComponent().hideBusyIndicator();
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

		/*showMessageBoxConfirmation: function(sMessage, fnConfirm){
			MessageBox.warning(
				sMessage,
				{
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: function(sAction) {
						if(sAction === sap.m.MessageBox.Action.OK){
							fnConfirm();
						}
					}
				}
			);
		},*/

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

					if (oData.Perfil === "ADMIN" || oData.Perfil === "JURID") {
						var oSideModel = that.getModel("side"),
							oSideData = oSideModel.getData();

						for (var i = 0; i < oSideData.navigation.length; i++) {
							if (oSideData.navigation[i].title === "Administrador") {
								oSideData.navigation[i].visible = true;
								var oItems = oSideData.navigation[i].items;
								for (var x = 0; x < oItems.length; x++) {
									if (oItems[x].key === "usersAdm" && oData.Perfil === "JURID") {
										oItems[x].visible = false;
									}
									if (oItems[x].key === "tiposDocumento" && oData.Perfil === "JURID") {
										oItems[x].visible = false;
									}
									if (oItems[x].key === "tiposSolic" && oData.Perfil === "JURID") {
										oItems[x].visible = false;
									}
								}
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

		validarCNPJ: function (cnpj) {

			var sCnpj = cnpj.replace(/[^\d]+/g, "");

			if (sCnpj === "") {
				return false;
			}
			if (sCnpj.length !== 14) {
				return false;
			}
			// Elimina CNPJs invalidos conhecidos
			if (sCnpj === "00000000000000" ||
				sCnpj === "11111111111111" ||
				sCnpj === "22222222222222" ||
				sCnpj === "33333333333333" ||
				sCnpj === "44444444444444" ||
				sCnpj === "55555555555555" ||
				sCnpj === "66666666666666" ||
				sCnpj === "77777777777777" ||
				sCnpj === "88888888888888" ||
				sCnpj === "99999999999999") {
				return false;
			}
			// Valida DVs
			var tamanho = sCnpj.length - 2,
				numeros = sCnpj.substring(0, tamanho),
				digitos = sCnpj.substring(tamanho),
				soma = 0,
				pos = tamanho - 7;

			for (var i = tamanho; i >= 1; i--) {
				soma += numeros.charAt(tamanho - i) * pos--;
				if (pos < 2) {
					pos = 9;
				}
			}
			var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
			if (resultado !== parseInt(digitos.charAt(0), 10)) {
				return false;
			}

			tamanho = tamanho + 1;
			numeros = cnpj.substring(0, tamanho);
			soma = 0;
			pos = tamanho - 7;
			for (var x = tamanho; x >= 1; x--) {
				soma += numeros.charAt(tamanho - x) * pos--;
				if (pos < 2) {
					pos = 9;
				}
			}
			resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
			if (resultado !== digitos.charAt(1)) {
				return false;
			}

			return true;

		},

		mascaraCnpj: function (valor) {
			return valor && valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3\/\$4\-\$5");
		},

		retirarFormatacao: function (sValue) {
			return sValue && sValue.replace(/(\.|\/|\-)/g, "");
		},

		onCloseDialog: function (oEvent) {
			oEvent.getSource().getParent().close();
		}
	});

});