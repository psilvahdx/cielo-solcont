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

			this.oDialogUsuarios = this.getDialogUsuarios("com.sap.build.sapcsr.SOLCONT.view.fragments.Usuarios");

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

		getDialogUsuarios: function (sFragment) {
			if (!this._oDialogUser) {
				this._oDialogUser = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogUser);
			}
			return this._oDialogUser;
		},

		_onOpenDialogUsuarios: function (oEvent) {
			var oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				oModel = this.getModel(),
				that = this;

			if (!oView.getModel("usuarios")) {
				oOwnerComponent.showBusyIndicator();

				oModel.read("/SolicitantesSet", {

					success: function (oData) {

						var oUsuariosModel = new JSONModel(oData);
						oView.setModel(oUsuariosModel, "usuarios");
						oOwnerComponent.hideBusyIndicator();
						that._oDialogUser.open();
					},
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(that.geti18nText("load_solicitantes_erro"));
					}

				});

			} else {
				this._oDialogUser.open();
				oOwnerComponent.hideBusyIndicator();
			}
		},

		_onSearchUser: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilter = new Filter([new Filter(
					"Usuario",
					sap.ui.model.FilterOperator.Contains,
					sValue
				),
				new Filter(
					"Nome",
					sap.ui.model.FilterOperator.Contains,
					sValue
				)
			]);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([aFilter]);
		},

		_onTableItemUserPress: function (oEvent) {
			var oSelItem = oEvent.getParameter("selectedItem"),
				ofilterModel = this.getModel("filterModel"),
				oFilterAdm = ofilterModel.getProperty("/admUsers");

			var oUsuario = this.getModel("usuarios").getObject(oSelItem.getBindingContextPath());
			oFilterAdm.idUser = oUsuario.Usuario;
			oFilterAdm.nome = oUsuario.Nome;
			ofilterModel.setProperty("/admUsers", oFilterAdm);

		},

		buildFilters: function (oFilterAdmUser) {

			var aFilter = new Filter([]),
				oFilter = {};

			if (oFilterAdmUser.idUser) {
				var oIdUser = oFilterAdmUser.idUser.toString();
				oFilter = new Filter("IdUsuario", sap.ui.model.FilterOperator.EQ, oIdUser.toUpperCase());
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterAdmUser.nome) {
				oFilter = new Filter("Nome", sap.ui.model.FilterOperator.Contains, oFilterAdmUser.nome);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterAdmUser.perfil) {
				oFilter = new Filter("Perfil", sap.ui.model.FilterOperator.EQ, oFilterAdmUser.perfil);
				aFilter.aFilters.push(oFilter);
			}

			return aFilter;
		},

		onSearch: function (oEvent) {

			var filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbUsers"),
				oBinding = oTable.getBinding("items"),
				oFilterUsers = filterModel.getProperty("/admUsers"),
				aFilter = this.buildFilters(oFilterUsers);

			oBinding.filter(aFilter.aFilters);

		},

		onClearFilters: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oFilterAdm = filterModel.getProperty("/admUsers");
			oFilterAdm = {
				idUser: "",
				nome: "",
				perfil: ""
			};
			filterModel.setProperty("/admUsers", oFilterAdm);
			this.onSearch();
		},

		onNavToEdit: function (oEvent) {

			var oContext = oEvent.getParameter("listItem").getBindingContext(),
				oObject = this.getModel().getObject(oContext.getPath());

			//this.showBusy();
			this.getRouter().navTo("editUsuario", {
				IdUsuario: oObject.IdUsuario
			});
		},

		onListUsersUpdateFinished: function (oEvent) {

			var iTotal = oEvent.getParameter("total");
			if (iTotal > 0) {
				this.byId("btnNewUser").setEnabled(false);
			} else {
				this.byId("btnNewUser").setEnabled(true);
			}

		},

		validateFields: function (oParams) {
			var bReturn = true;
			this.byId("inpIdUser").setValueState("None");
			this.byId("cmbPerfil").setValueState("None");
			if (oParams.IdUsuario === "") {
				this.byId("inpIdUser").setValueState("Error");
				bReturn = false;
			}
			if (oParams.Perfil === "") {
				this.byId("cmbPerfil").setValueState("Error");
				bReturn = false;
			}
			return bReturn;
		},

		onNewUser: function (oEvent) {

			var that = this,
				entitySet = "/UsuarioPerfilSet",
				oModel = this.getModel(),
				filterModel = this.getModel("filterModel"),
				oFilterAdm = filterModel.getProperty("/admUsers");

			var oParams = {
				IdUsuario: oFilterAdm.idUser,
				Nome: oFilterAdm.nome,
				Perfil: oFilterAdm.perfil
			};

			if (this.validateFields(oParams)) {
				oModel.create(entitySet, oParams, {
					success: function (oData) {
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("insere_user_sucesso_msg"));
						that.getOwnerComponent().hideBusyIndicator();
						that.onClearFilters();
						oModel.refresh();
					},
					error: function (oError) {
						that.getOwnerComponent()._genericErrorMessage(that.geti18nText("insere_user_erro"));
						that.getOwnerComponent().hideBusyIndicator();
						oModel.refresh(true);

					}
				});
			}else{
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}

		}

	});
});