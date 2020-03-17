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

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.TiposDocumento", {

		onInit: function () {

			var oViewModel = new JSONModel({
				isPhone: Device.system.phone
			});

			//define um model para celular
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));

			this._oEditDialog = this.getDialog("com.sap.build.sapcsr.SOLCONT.view.fragments.EditTipoDoc");

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("tiposDocumento").attachPatternMatched(this._onRouteMatched, this);

		},

		_onRouteMatched: function (oEvent) {
			this.onSearchTpDoc();
		},

		getDialog: function (sFragment) {
			if (!this._oEditDialog) {
				this._oEditDialog = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oEditDialog);
			}
			return this._oEditDialog;
		},

		onListTpDocUpdateFinished: function (oEvent) {

			var iTotal = oEvent.getParameter("total");
			if (iTotal > 0) {
				this.byId("btnNewTpDoc").setEnabled(false);
			} else {
				this.byId("btnNewTpDoc").setEnabled(true);
			}

		},

		buildFilters: function (oFilterTpDoc) {

			var aFilter = new Filter([]),
				oFilter = {};

			oFilter = new Filter("IpDominio", sap.ui.model.FilterOperator.EQ, "ZMMD_SOLCONT_TPDOCUMENTO");
			aFilter.aFilters.push(oFilter);

			if (oFilterTpDoc.Descricao) {
				oFilter = new Filter("Descricao", sap.ui.model.FilterOperator.Contains, oFilterTpDoc.Descricao);
				aFilter.aFilters.push(oFilter);
			}
			return aFilter;
		},

		onSearchTpDoc: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbTipoDoc"),
				oBinding = oTable.getBinding("items"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");
			oFilterTpDoc.Descricao = oEvent ? oEvent.getParameter("value") : "";
			var aFilter = this.buildFilters(oFilterTpDoc);

			oBinding.filter(aFilter.aFilters);
		},

		onEditTpDoc: function (oEvent) {
			var oEditModel = this.getModel("structureApp"),
				oEdit = oEditModel.getProperty("/tiposDoc");
			var sPath = oEvent.getSource().getParent().getBindingContextPath(),
				oSelItem = this.getModel("shModel").getObject(sPath);

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
			this.onSearchTpDoc();
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

		onNewTpDoc: function (oEvent) {
			var oShModel = this.getModel("shModel"),
				filterModel = this.getModel("filterModel"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");

			var oParams = {
				IpDominio: "ZMMD_SOLCONT_TPDOCUMENTO",
				Id: oFilterTpDoc.Id,
				Descricao: oFilterTpDoc.Descricao
			};

			if (this.validateFields(oParams, "inpTpDoc")) {
				this.SaveTipoDoc(oParams, oShModel);
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
		},

		onSaveEdit: function () {
			var oShModel = this.getModel("shModel"),
				filterModel = this.getModel("structureApp"),
				oFilterTpDoc = filterModel.getProperty("/tiposDoc");

			var oParams = {
				IpDominio: "ZMMD_SOLCONT_TPDOCUMENTO",
				Id: oFilterTpDoc.Id,
				Descricao: oFilterTpDoc.Descricao
			};

			if (this.validateFields(oParams, "inpDesc")) {
				this.SaveTipoDoc(oParams, oShModel);
				this._oEditDialog.close();
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
		},

		onDeleteTpDoc: function (oEvent) {
			var that = this,
				sPath = oEvent.getSource().getParent().getBindingContextPath(),
				oShModel = this.getModel("shModel"),
				oSelItem = this.getModel("shModel").getObject(sPath),
				sMessage = this.geti18nText1("excluir_tpDoc_conf_msg", [oSelItem.Descricao]);

			MessageBox.warning(
				sMessage, {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							that.deleteTipoDoc(oSelItem, oShModel);
						}
					}
				});

		},

		SaveTipoDoc: function (oParams, oShModel) {
			var that = this,
				entitySet = "/SearchHelpSet",
				oModel = this.getModel();

			oModel.create(entitySet, oParams, {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("insere_tpdoc_sucesso_msg"));
					that.getOwnerComponent().hideBusyIndicator();
					that.onClearFilters();
					oModel.refresh();
					oShModel.refresh();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("insere_tpdoc_erro"));
					that.getOwnerComponent().hideBusyIndicator();
					oModel.refresh(true);
					oShModel.refresh(true);

				}
			});

		},

		deleteTipoDoc: function (oDelItem, oShModel) {
			var that = this,
				entitySet = "/SearchHelpSet",
				oModel = this.getModel();

			oModel.remove(oModel.createKey(entitySet, {
				IpDominio: "ZMMD_SOLCONT_TPDOCUMENTO",
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
		}

	});

});