sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"com/sap/build/sapcsr/SOLCONT/model/formatter",
	"com/sap/build/sapcsr/SOLCONT/model/jqueryMask"
], function (BaseController, MessageBox, ODataModel, Filter, FilterOperator, MessageToast,
	JSONModel, Device, formatter, jqueryMask) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.ParteRelacionada", {
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

			this._oEditDialog = this.getDialog("com.sap.build.sapcsr.SOLCONT.view.fragments.EditParteRelacionada");

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("parteRelacionada").attachPatternMatched(this._onRouteMatched, this);

		},

		_onRouteMatched: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oFilterParteRel = filterModel.getProperty("/parteRel");
			oFilterParteRel = {
				Id: "",
				Cnpj: "",
				RazaoSoc: "",
				SearchStr: ""
			};
			filterModel.setProperty("/tiposDoc", oFilterParteRel);
			filterModel.refresh();
			this.onSearchParteRel();
		},

		getDialog: function (sFragment) {
			if (!this._oEditParteRelDialog) {
				this._oEditParteRelDialog = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oEditParteRelDialog);
			}
			return this._oEditParteRelDialog;
		},
		
		onCnpjLiveChange: function (oEvent) {

			var brCnpjBehaviour = function (value) {
					return value.replace(/\D/g, "").length === 14 ? "00.000.000/0000-00" : "00.000.000/0000-00";
				},
				brOptions = {
					onKeyPress: function (value, event, field, options) {
						var behaviour;
						behaviour = brCnpjBehaviour;
						field.mask(behaviour.apply({}, arguments), options);
					}
				};

			var oInput = oEvent.getSource().getId() + "-inner";
			$(document.getElementById(oInput)).mask(brCnpjBehaviour, brOptions);

		},

		onListParteRelUpdateFinished: function (oEvent) {

		/*	var iTotal = oEvent.getParameter("total");
			if (iTotal > 0) {
				this.byId("btnNewParteRel").setEnabled(false);
			} else {
				this.byId("btnNewParteRel").setEnabled(true);
			}*/

		},

		buildFilters: function (oFilterParteRel) {

			var aFilter = new Filter([]),
				oFilter = {};

			if (oFilterParteRel.Id) {
				oFilter = new Filter("Id", sap.ui.model.FilterOperator.EQ, oFilterParteRel.Id);
				aFilter.aFilters.push(oFilter);
			}
			
			if (oFilterParteRel.SearchStr) {
				oFilter = new Filter("SearchStr", sap.ui.model.FilterOperator.Contains, oFilterParteRel.SearchStr);
				aFilter.aFilters.push(oFilter);
			}
			
			return aFilter;
		},

		onSearchParteRel: function (oEvent) {
			var sValue = oEvent ? oEvent.getParameter("query") : "",
				filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbParteRel"),
				oBinding = oTable.getBinding("items"),
				oFilterParteRel = filterModel.getProperty("/parteRel");
				
			oFilterParteRel.SearchStr = this.retirarFormatacao(sValue);
			
			var aFilter = this.buildFilters(oFilterParteRel);

			oBinding.filter(aFilter.aFilters);
		},

		onEditParteRel: function (oEvent) {
			var oEditModel = this.getModel("structureApp"),
				oEdit = oEditModel.getProperty("/parteRelEdit");
			var sPath = oEvent.getSource().getParent().getBindingContextPath(),
				oSelItem = this.getModel().getObject(sPath);

			oEdit.Id = oSelItem.Id;
			oEdit.RazaoSoc = oSelItem.RazaoSoc;
			oEdit.Cnpj = oSelItem.Cnpj;
			oEditModel.refresh(true);
			this._oEditParteRelDialog.open();
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

			if (oParams.Cnpj === "") {
				oInput.setValueState("Error");
				bReturn = false;
			}
			
			if (oParams.RazaoSoc === "") {
				oInput.setValueState("Error");
				bReturn = false;
			}
			
			return bReturn;
		},

		onClearFilters: function () {
			var filterModel = this.getModel("filterModel"),
				structureAppModel = this.getModel("structureApp"),
				oFilterParteRel = filterModel.getProperty("/parteRel");
				oFilterParteRel = {
				Id: "",
				Cnpj: "",
				RazaoSoc: "",
				SearchStr: ""
			};
			filterModel.setProperty("/parteRel", oFilterParteRel);
			structureAppModel.setProperty("/parteRel", oFilterParteRel);
			structureAppModel.refresh();
			this.onSearchParteRel();
		},

		onEditClose: function (oEvent) {
			var oStructrureApp = this.getModel("structureApp");
				oStructrureApp.parteRelEdit = {
				Id: "",
				Cnpj: "",
				RazaoSoc: "",
				SearchStr: ""
			};
			oStructrureApp.refresh();
			this._oEditParteRelDialog.close();
		},

		onNewParteRel: function (oEvent) {
			var oModel = this.getModel(),
				structureAppModel = this.getModel("structureApp"),
				oParteRel = structureAppModel.getProperty("/parteRel");

			var oParams = {
				
				Id: oParteRel.Id,
				Cnpj: this.retirarFormatacao(oParteRel.Cnpj),
				RazaoSoc: oParteRel.RazaoSoc
			};
			
			var isValid = this.validateFields(oParams, "inpRazaoSoc");
				isValid = this.validateFields(oParams, "inpCnpj");

			if (isValid) {
				this.SaveParteRelacionada(oParams, oModel);
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
		},

		onSaveEdit: function () {
			var oModel = this.getModel(),
				oEditModel = this.getModel("structureApp"),
				oEditParteRel = oEditModel.getProperty("/parteRelEdit");
			var sCnpj = sap.ui.getCore().byId("inpCnpjEdit").getValue();
			//oEditModel.refresh(true);
			var oParams = {
				Id: oEditParteRel.Id,
				Cnpj: this.retirarFormatacao(sCnpj),
				RazaoSoc: oEditParteRel.RazaoSoc
			};
			
			var isValid = this.validateFields(oParams, "inpRazaoSocEdit");
				isValid = this.validateFields(oParams, "inpCnpjEdit");

			if (isValid) {
				this.SaveParteRelacionada(oParams, oModel);
				this._oEditParteRelDialog.close();
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
		},

		onDeleteParteRel: function (oEvent) {
			var that = this,
				sPath = oEvent.getSource().getParent().getBindingContextPath(),
				oShModel = this.getModel(),
				oSelItem = this.getModel().getObject(sPath),
				sMessage = this.geti18nText1("excluir_parte_rel_conf_msg", [oSelItem.RazaoSoc]);

			MessageBox.warning(
				sMessage, {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							that.deleteParteRel(oSelItem, oShModel);
						}
					}
				});

		},

		SaveParteRelacionada: function (oParams, oShModel) {
			var that = this,
				entitySet = "/ParteRelacionadaSet",
				oModel = this.getModel();
				
				var oParteRel = {
					Id: "",
					ParteRelacionadaItemSet: []
				};
				
				oParteRel.ParteRelacionadaItemSet.push(oParams);

			oModel.create(entitySet, oParteRel, {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("insere_parte_rel_sucesso_msg"));
					that.onClearFilters();
					oModel.refresh();
					//oShModel.refresh();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("insere_parte_rel_erro"));
					oModel.refresh(true);
					//oShModel.refresh(true);
				}
			});

		},

		deleteParteRel: function (oDelItem, oShModel) {
			var that = this,
				entitySet = "/ParteRelacionadaItemSet",
				oModel = this.getModel();

			oModel.remove(oModel.createKey(entitySet, {
				Id: oDelItem.Id
			}), {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("excluir_parte_rel_sucess_msg"));
					oShModel.refresh();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("excluir_parte_rel_erro"));
					oShModel.refresh(true);
				}
			});
		},

		onExit: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oFilterParteRel = filterModel.getProperty("/parteRel");
			oFilterParteRel = {
				Id: "",
				Cnpj: "",
				RazaoSoc: "",
				SearchStr: ""
			};
			filterModel.setProperty("/parteRel", oFilterParteRel);
		}

	});

});