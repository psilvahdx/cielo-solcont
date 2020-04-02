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
	"com/sap/build/sapcsr/SOLCONT/model/formatter",
	"com/sap/build/sapcsr/SOLCONT/model/jqueryMask",
	"sap/ui/export/Spreadsheet"
], function (BaseController, MessageBox, ODataModel, Filter, FilterOperator, MessageToast,
	JSONModel, Device, ValueHelpDialog, formatter, jqueryMask, Spreadsheet) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.GerenciadorPendencias", {
		formatter: formatter,

		onInit: function () {

			var oViewModel = new JSONModel({
				isPhone: Device.system.phone
			});

			this.getOwnerComponent().oListSolicGerenPend = this.getView().byId("tbGerenciadorPendencias");
			this.oDialogSolicitantes = this.getDialogSolicitantes("com.sap.build.sapcsr.SOLCONT.view.fragments.Solicitantes");

			//define um model para celular
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("gerenPendencias").attachPatternMatched(this._onRouteMatched, this);
		},

		//função que copia todos os dados do oData para os campos na tela
		_onRouteMatched: function (oEvent) {
			this.onSearch(oEvent);
		},

		buildFilters: function (oFilterGer) {

			var aFilter = new Filter([]),
				oFilter = {};

			oFilter = new Filter("Situacao", sap.ui.model.FilterOperator.NE, "XX"); //VAZIO - Em Aberta
			aFilter.aFilters.push(oFilter);
			
			//oFilter = new Filter("Modulo", sap.ui.model.FilterOperator.EQ, "GERENC");
			//aFilter.aFilters.push(oFilter);

			if (oFilterGer.solicitante) {
				oFilter = new Filter("NomeResponsavel", sap.ui.model.FilterOperator.Contains, oFilterGer.solicitante);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.numero) {
				oFilter = new Filter("NumSolic", sap.ui.model.FilterOperator.EQ, oFilterGer.numero);
				aFilter.aFilters.push(oFilter);
			}
			return aFilter;
		},

		onSearch: function (oEvent) {

			var filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbGerenciadorPendencias"),
				oBinding = oTable.getBinding("items"),
				oFilterGer = filterModel.getProperty("/gerenciador"),
				aFilter = this.buildFilters(oFilterGer);
			
			oBinding.filter(aFilter.aFilters);

		},

		onClearFilters: function (oEvent) {
			var filterModel = this.getModel("filterModel"),
				oFilterGer = filterModel.getProperty("/gerenciador");
			oFilterGer = {
				solicitante: "",
				razao: "",
				dtPeriodoDe: "",
				dtPeriodoAte: "",
				numero: "",
				cnpj: "",
				titulo: "",
				tipo: "",
				gerencia: "",
				advogado: "",
				situacao: ""
			};
			filterModel.setProperty("/gerenciador", oFilterGer);
		},

		readSolicitacoes: function (aFilters) {
			var that = this,
				oModel = this.getModel(),
				oView = this.getView();

			oModel.read("/GravarContratoJuridicoSet", {
				filters: aFilters,
				success: function (oData) {
					var oGerenciadorModel = new JSONModel(oData.results);
					oView.setModel(oGerenciadorModel, "gerenciadorModel");
					that.hideBusy();
				},
				error: function (oError) {
					that.hideBusy();
					that._genericErrorMessage(that.geti18nText("load_solicitacoes_error_msg"));
				}

			});

		},

		onTbGernciaPencenciaSelecChange: function (oEvent) {
			var oSelectedContexts = this.byId("tbGerenciadorPendencias").getSelectedContexts();

			if (oSelectedContexts.length > 0) {
				this.byId("btnRedirecionarPendencias").setEnabled(true);
			} else {
				this.byId("btnRedirecionarPendencias").setEnabled(false);
			}

		},

		onRedirectParaPress: function (oEvent) {
			var oSelectedContexts = this.byId("tbGerenciadorPendencias").getSelectedContexts(),
				structureAppModel = this.getModel("structureApp"),
				oRedirecionar = structureAppModel.getProperty("/redirecionarData");
			oRedirecionar.solicitacao = [];

			for (var i = 0; i < oSelectedContexts.length; i++) {
				var oSolicitacao = oSelectedContexts[i].getObject(),
					oSelectedItem = {
						NumSolic: oSolicitacao.NumSolic,
						UsrSolic: oSolicitacao.UsrSolic,
						UsrRedir: ""
					};

				oRedirecionar.solicitacao.push(oSelectedItem);
			}
			structureAppModel.setProperty("/redirecionarData", oRedirecionar);
			this._onRedirecSol(oEvent);
		},

		_onRedirecSol: function (oEvent) {
			this.oDialogDefineRedirec = this.getDialogRedirecionarPara("com.sap.build.sapcsr.SOLCONT.view.fragments.RedirecionarPara");
			this._onOpenDialogRedirSolic(oEvent);

		},

		getDialogRedirecionarPara: function (sFragment) {
			if (!this._oDialogDefineRedirec) {
				this._oDialogDefineRedirec = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogDefineRedirec);
			}

			return this._oDialogDefineRedirec;
		},

		_onOpenDialogRedirSolic: function (oEvent) {
			var oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				oModel = this.getModel(),
				that = this;

			if (!oView.getModel("solicitantes")) {
				oOwnerComponent.showBusyIndicator();

				oModel.read("/SolicitantesSet", {

					success: function (oData) {

						var oAprovModel = new JSONModel(oData);
						oView.setModel(oAprovModel, "solicitantes");
						oOwnerComponent.hideBusyIndicator();
						that._oDialogDefineRedirec.open();
					},
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(that.geti18nText("load_advogados_erro"));
					}

				});

			} else {
				this._oDialogDefineRedirec.open();
				oOwnerComponent.hideBusyIndicator();
			}
		},

		_onTableItemSolicRedirPress: function (oEvent) {

			var oSelItem = oEvent.getParameter("selectedItem"),
				structureAppModel = this.getModel("structureApp"),
				oRedirecionar = structureAppModel.getProperty("/redirecionarData");

			var oSolicitante = this.getModel("solicitantes").getObject(oSelItem.getBindingContextPath());

			for (var i = 0; i < oRedirecionar.solicitacao.length; i++) {
				oRedirecionar.solicitacao[i].UsrRedir = oSolicitante.Usuario;
			}
			//transfere Solicitações para Usuário Solicitante selecionado
			var sMsg = this.geti18nText1("redirecionar_confirm_msg", [oSolicitante.Nome]);
			this.showMessageBoxConfirmation(sMsg, oRedirecionar, "R");
		},

		showMessageBoxConfirmation: function (sMessage, oSolicitacao, sEvento) {
			var that = this;
			MessageBox.warning(
				sMessage, {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							that.redirecionaSolicitacao(oSolicitacao, sEvento);
						}
					}
				}
			);
		},

		redirecionaSolicitacao: function (oSolicitacao, sEvento) {
			this.getOwnerComponent().showBusyIndicator();
			var that = this,
				oModel = this.getModel(),
				oGerenModel = this.getModel("gerenciadorModel"),
				//	sText = "",
				entitySet = "/RedirecionarSolicitacaoSet",
				oParams = {
					NumSolic: "",
					Evento: sEvento,
					RedirecionarSolicItemSet: oSolicitacao.solicitacao
				};

			oModel.create(entitySet, oParams, {
				success: function (oData) {
					that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("redirecionar_sucess_msg"));
					that.getOwnerComponent().hideBusyIndicator();
					oGerenModel.refresh();
					var oTable = that.byId("tbGerenciadorPendencias"),
						oBtnRedir = that.byId("btnRedirecionarPendencias");
					oTable.removeSelections();
					oBtnRedir.setEnabled(false);
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("solicitacao_erro"));
					that.getOwnerComponent().hideBusyIndicator();
					oModel.refresh(true);
				}
			});
		},

		getDialogSolicitantes: function (sFragment) {
			if (!this._oDialogSolic) {
				this._oDialogSolic = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogSolic);
			}
			return this._oDialogSolic;
		},

		_onTableItemProcPress: function (oEvent) {
			var oSelItem = oEvent.getParameter("selectedItem"),
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			var oProcurador = this.getModel("procuradores").getObject(oSelItem.getBindingContextPath());
			structureApp.procuradorData.Matricula = oProcurador.Matricula;
			structureApp.procuradorData.Nome = oProcurador.Nome;

			structureAppModel.setData(structureApp);
		},

		_onOpenDialogSolicitante: function (oEvent) {
			var oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				oModel = this.getModel(),
				that = this;

			if (!oView.getModel("solicitantes")) {
				oOwnerComponent.showBusyIndicator();

				oModel.read("/SolicitantesSet", {

					success: function (oData) {

						var oSolicitanteModel = new JSONModel(oData);
						oView.setModel(oSolicitanteModel, "solicitantes");
						oOwnerComponent.hideBusyIndicator();
						that._oDialogSolic.open();
					},
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(that.geti18nText("load_solicitantes_erro"));
					}

				});

			} else {
				this._oDialogSolic.open();
				oOwnerComponent.hideBusyIndicator();
			}
		},

		_onSearchSolic: function (oEvent) {
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

		_onTableItemSolicPress: function (oEvent) {
			var oSelItem = oEvent.getParameter("selectedItem"),
				ofilterModel = this.getModel("filterModel"),
				oFilterGer = ofilterModel.getProperty("/gerenciador");

			var oSolicitante = this.getModel("solicitantes").getObject(oSelItem.getBindingContextPath());
			oFilterGer.solicitante = oSolicitante.Nome;
			ofilterModel.setProperty("/gerenciador", oFilterGer);

		}

	});
});