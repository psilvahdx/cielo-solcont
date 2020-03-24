sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (BaseController, MessageBox, ODataModel, Filter, FilterOperator, MessageToast,
	JSONModel, Device) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.TiposSolicitacao", {

		onInit: function () {

			var oViewModel = new JSONModel({
				isPhone: Device.system.phone
			});

			//define um model para celular
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));

			this._oEditDialog = this.getDialog("com.sap.build.sapcsr.SOLCONT.view.fragments.EditTipoSol");

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("tiposSolicitacao").attachPatternMatched(this._onRouteMatched, this);

		},

		_onRouteMatched: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");
			oFilterTpDoc = {
				Id: "",
				Descricao: "",
				isEdit: false
			};
			filterModel.setProperty("/tiposDoc", oFilterTpDoc);
			this.onSearchTpSol();
		},

		getDialog: function (sFragment) {
			if (!this._oEditDialog) {
				this._oEditDialog = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oEditDialog);
			}
			return this._oEditDialog;
		},

		onListTpSolUpdateFinished: function (oEvent) {

			var iTotal = oEvent.getParameter("total");
			if (iTotal > 0) {
				this.byId("btnNewTpSol").setEnabled(false);
			} else {
				this.byId("btnNewTpSol").setEnabled(true);
			}

		},

		buildFilters: function (oFilterTpDoc) {

			var aFilter = new Filter([]),
				oFilter = {};

			oFilter = new Filter("IpDominio", sap.ui.model.FilterOperator.EQ, "ZMMD_SOLCONT_TPSOLICITACAO");
			aFilter.aFilters.push(oFilter);

			if (oFilterTpDoc.Descricao) {
				oFilter = new Filter("Descricao", sap.ui.model.FilterOperator.Contains, oFilterTpDoc.Descricao);
				aFilter.aFilters.push(oFilter);
			}
			return aFilter;
		},

		onSearchTpSol: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbTipoSol"),
				oBinding = oTable.getBinding("items"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");
			oFilterTpDoc.Descricao = oEvent ? oEvent.getParameter("value") : "";
			var aFilter = this.buildFilters(oFilterTpDoc);

			oBinding.filter(aFilter.aFilters);
		},

		onEditTpSol: function (oEvent) {
			var oEditModel = this.getModel("structureApp"),
				oEdit = oEditModel.getProperty("/tiposDoc");
			var sPath = oEvent.getSource().getParent().getBindingContextPath(),
				oSelItem = this.getModel().getObject(sPath);

			oEdit.Id = oSelItem.Id;
			oEdit.Descricao = oSelItem.Descricao;
			oEditModel.setProperty("/tiposDoc", oEdit);
			this._oEditDialog.open();
		},

		validateFields: function (oParams, oIdInput) {
			var bReturn = true;
			var oInput;
			if (this.byId(oIdInput)) {
				oInput = this.byId(oIdInput);
			} else {
				oInput = sap.ui.getCore().byId(oIdInput);

			}
			oInput.setValueState("None");

			if (oParams.Descricao === "") {
				oInput.setValueState("Error");
				bReturn = false;
			}
			return bReturn;
		},

		onClearFilters: function () {
			var filterModel = this.getModel("filterModel"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");
			oFilterTpDoc = {
				Id: "",
				Descricao: "",
				isEdit: false
			};
			filterModel.setProperty("/tiposDoc", oFilterTpDoc);
			this.onSearchTpSol();
		},

		onEditClose: function (oEvent) {
			var oStructrureApp = this.getModel("structureApp"),
				oFilterTpDoc = oStructrureApp.getProperty("/tiposDoc");
			oFilterTpDoc = {
				Id: "",
				Descricao: "",
				isEdit: false
			};
			oStructrureApp.setProperty("/tiposDoc", oFilterTpDoc);
			this._oEditDialog.close();
		},

		onNewTpSol: function (oEvent) {
			var oShModel = this.getModel("shModel"),
				filterModel = this.getModel("filterModel"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");

			var oParams = {
				IpDominio: "ZMMD_SOLCONT_TPSOLICITACAO",
				Id: oFilterTpDoc.Id,
				Descricao: oFilterTpDoc.Descricao
			};

			if (this.validateFields(oParams, "inpTpSol")) {
				this.SaveTipoSol(oParams, oShModel);
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
		},

		onSaveEdit: function () {
			var oShModel = this.getModel("shModel"),
				filterModel = this.getModel("structureApp"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");

			var oParams = {
				IpDominio: "ZMMD_SOLCONT_TPSOLICITACAO",
				Id: oFilterTpDoc.Id,
				Descricao: oFilterTpDoc.Descricao
			};

			if (this.validateFields(oParams, "inpDescTpSol")) {
				this.SaveTipoSol(oParams, oShModel);
				this._oEditDialog.close();
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
		},

		onDeleteTpSol: function (oEvent) {
			var that = this,
				sPath = oEvent.getSource().getParent().getBindingContextPath(),
				oShModel = this.getModel(),
				oSelItem = this.getModel().getObject(sPath),
				sMessage = this.geti18nText1("excluir_tpSol_conf_msg", [oSelItem.Descricao]);

			MessageBox.warning(
				sMessage, {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							that.deleteTipoSol(oSelItem, oShModel);
						}
					}
				});

		},

		SaveTipoSol: function (oParams, oShModel) {
			var that = this,
				entitySet = "/SearchHelpSet",
				oModel = this.getModel();

			oModel.create(entitySet, oParams, {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("insere_tpdoc_sucesso_msg"));
					that.onClearFilters();
					oModel.refresh();
					oShModel.refresh();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("insere_tpsol_erro"));
					oModel.refresh(true);
					oShModel.refresh(true);
				}
			});

		},

		deleteTipoSol: function (oDelItem, oShModel) {
			var that = this,
				entitySet = "/SearchHelpSet",
				oModel = this.getModel();

			oModel.remove(oModel.createKey(entitySet, {
				IpDominio: "ZMMD_SOLCONT_TPSOLICITACAO",
				Id: oDelItem.Id
			}), {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("excluir_tpdoc_sucess_msg"));
					oShModel.refresh();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("excluir_tpdoc_erro"));
					oShModel.refresh(true);
				}
			});
		},

		onExit: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");
			oFilterTpDoc = {
				Id: "",
				Descricao: "",
				isEdit: false
			};
			filterModel.setProperty("/tiposDoc", oFilterTpDoc);
		}

	});

});