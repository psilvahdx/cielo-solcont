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

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.Gerenciador", {
		formatter: formatter,

		onInit: function () {

			var oViewModel = new JSONModel({
				isPhone: Device.system.phone
			});

			this.getOwnerComponent().oListSolicGerenciador = this.getView().byId("tbSolicitacoesGerenciador");
			this.oDialogProcuradores = this.getDialogProcuradores("com.sap.build.sapcsr.SOLCONT.view.fragments.Procuradores");
			this.oDialogSolicitantes = this.getDialogSolicitantes("com.sap.build.sapcsr.SOLCONT.view.fragments.Solicitantes");

			//define um model para celular
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));

			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("gerenciador").attachPatternMatched(this._onRouteMatched, this);
		},

		//função que copia todos os dados do oData para os campos na tela
		_onRouteMatched: function (oEvent) {
			var that = this,
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			/*this.getView().bindElement({
				path: "/UsuarioPerfilSet",
				events: {
					dataReceived: function (oEvent) {
						that.hideBusy();
					}
				}
			});*/
		},

		buildFilters: function (oFilterGer) {

			var aFilter = new Filter([]),
				oFilter = {},
				oView = this.getView();

			if (oFilterGer.solicitante) {
				oFilter = new Filter("Solicitante", sap.ui.model.FilterOperator.Contains, oFilterGer.solicitante);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.razao) {
				oFilter = new Filter("RazaoSoc", sap.ui.model.FilterOperator.Contains, oFilterGer.razao);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.dtPeriodoDe) {
				oFilter = new Filter("DtVigenciaIni", sap.ui.model.FilterOperator.EQ, oView.byId("inpDtPeriodoDe").getDateValue());
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.dtPeriodoAte) {
				oFilter = new Filter("DtVigenciaFim", sap.ui.model.FilterOperator.EQ, oView.byId("inpDtPeriodoAte").getDateValue());
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.numero) {
				oFilter = new Filter("NumSolic", sap.ui.model.FilterOperator.EQ, oFilterGer.numero);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.cnpj) {
				var sUnMaskCnpj = this.retirarFormatacao(oFilterGer.cnpj);
				oFilter = new Filter("CnpjCpf", sap.ui.model.FilterOperator.EQ, sUnMaskCnpj);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.titulo) {
				oFilter = new Filter("DescSolic", sap.ui.model.FilterOperator.Contains, oFilterGer.titulo);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.tipo) {
				oFilter = new Filter("TpSolic", sap.ui.model.FilterOperator.EQ, oFilterGer.tipo);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.gerencia) {
				oFilter = new Filter("Gerencia", sap.ui.model.FilterOperator.EQ, oFilterGer.gerencia);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.advogado) {
				oFilter = new Filter("NumAdvogado", sap.ui.model.FilterOperator.EQ, oFilterGer.advogado);
				aFilter.aFilters.push(oFilter);
			}
			if (oFilterGer.situacao) {
				oFilter = new Filter("Situacao", sap.ui.model.FilterOperator.EQ, oFilterGer.situacao);
				aFilter.aFilters.push(oFilter);
			}

			return aFilter;
		},

		onSearch: function (oEvent) {

			var filterModel = this.getModel("filterModel"),
				oTable = this.byId("tbSolicitacoesGerenciador"),
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

		handlePopoverPress: function (oEvent) {

			var oContextPath = oEvent.getSource().getParent().getBindingContextPath(),
				oObject = this.getModel("gerenciadorModel").getObject(oContextPath),
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			structureApp.procuradorData.NumSolic = oObject.NumSolic;
			structureApp.procuradorData.RazaoSoc = oObject.RazaoSoc;
			structureAppModel.setData(structureApp);

			// create popover
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("com.sap.build.sapcsr.SOLCONT.view.fragments.Acoes", this);
				this.getView().addDependent(this._oPopover);
			}
			this._oPopover.openBy(oEvent.getSource());

		},

		_onCriarAlt: function (oEvent) {
			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				iNumSol = parseInt(structureApp.procuradorData.NumSolic, 10),
				sFinalText = this.geti18nText("finalizacao_txt"),
				sMessage = this.geti18nText1("confirm_finaliza_sol_msg", [sFinalText, iNumSol]);

			this.showMessageBoxConfirmation(sMessage, structureApp, "F");
		},

		_onCancelar: function (oEvent) {
			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				iNumSol = parseInt(structureApp.procuradorData.NumSolic, 10),
				sFinalText = this.geti18nText("cancelamento_txt"),
				sMessage = this.geti18nText1("confirm_finaliza_sol_msg", [sFinalText, iNumSol]);

			this.showMessageBoxConfirmation(sMessage, structureApp, "C");
		},

		_onEParecer: function (oEvent) {
			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				iNumSol = parseInt(structureApp.procuradorData.NumSolic, 10);

			this.getRouter().navTo("Parecer", {
				IdSolic: iNumSol
			});
		},

		_onVizualizar: function (oEvent) {
			this.showBusy();

			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				iNumSol = parseInt(structureApp.procuradorData.NumSolic, 10);

			this.getRouter().navTo("contrato", {
				IdSolic: iNumSol
			});
		},

		_onAlterar: function (oEvent) {
			this.showBusy();

			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				iNumSol = parseInt(structureApp.procuradorData.NumSolic, 10);

			this.getRouter().navTo("contrato", {
				IdSolic: iNumSol
			});
		},

		_onDefineProc: function (oEvent) {
			this.oDialogDefineProc = this.getDialogDefineProc("com.sap.build.sapcsr.SOLCONT.view.fragments.DefineProcurador");
			this.oDialogDefineProc.open();

		},

		onDtPeriodoDeChange: function (oEvent) {
			var dMindate = oEvent.getSource().getDateValue();
			this.byId("inpDtPeriodoAte").setValue("");
			this.byId("inpDtPeriodoAte").setMinDate(dMindate);
		},

		createColumnConfig: function () {
			var aCols = [];

			//template: '{0}, {1}'

			aCols.push({
				label: this.geti18nText("num_txt"),
				property: "NumSolic",
				type: "string"
			});

			aCols.push({
				label: this.geti18nText("title_txt"),
				property: "DescSolic",
				type: "string"
			});

			aCols.push({
				label: this.geti18nText("solicitante_txt"),
				property: "Solicitante",
				type: "string"
			});

			aCols.push({
				label: this.geti18nText("razao_social_txt"),
				property: "RazaoSoc",
				type: "string"
			});

			aCols.push({
				label: this.geti18nText("situacao_txt"),
				property: "Situacao",
				type: "string"
			});

			aCols.push({
				label: this.geti18nText("data_txt"),
				property: "DtSolic",
				type: "date"
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("tbSolicitacoesGerenciador");
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding("items");

			aCols = this.createColumnConfig();

			var oModel = oRowBinding.getModel("gerenciadorModel");
			var oModelInterface = oModel.getInterface();

			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: {
					type: "oData",
					dataUrl: oRowBinding.getDownloadUrl ? oRowBinding.getDownloadUrl() : null,
					serviceUrl: oModelInterface.sServiceUrl,
					headers: oModelInterface.getHeaders ? oModelInterface.getHeaders() : null,
					count: oRowBinding.getLength ? oRowBinding.getLength() : null,
					useBatch: oModelInterface.bUseBatch,
					sizeLimit: oModelInterface.iSizeLimit
				},
				worker: true
			};

			new Spreadsheet(oSettings).build();
		},

		/*	onExport: function () {
				var listBinding = this.byId("tbSolicitacoesGerenciador").getBinding("items");
				var oModel = listBinding.getModel("gerenciadorModel");
				var oModelInterface = oModel.getInterface();
				
				this.exportSpreadsheet({
					workbook: {
							columns: this.createColumnConfig()
						},
						dataSource: {
							type: "oData",
							dataUrl: listBinding.getDownloadUrl ? listBinding.getDownloadUrl() : null,
							serviceUrl: oModelInterface.sServiceUrl,
							headers: oModelInterface.getHeaders ? oModelInterface.getHeaders() : null,
							count: listBinding.getLength ? listBinding.getLength() : null,
							useBatch: oModelInterface.bUseBatch,
							sizeLimit: oModelInterface.iSizeLimit
						},
						worker: true 
				},this.onSucessExport,this.onErrorExport);
					
				/*this.exportSpreadsheet({
					workbook: {
						columns: this.createColumnConfig()
					},
					dataSource: {
						type: "OData",
						useBatch: true,
						serviceUrl: listBinding.getModel("gerenciadorModel").sServiceUrl,
						headers: listBinding.getModel("gerenciadorModel").getHeaders(),
						dataUrl: listBinding.getDownloadUrl(), // includes the $expand param.
						count: listBinding.getLength(),
						sizeLimit: oModelInterface.iSizeLimit
					},
					worker: true // should be false if mock server or CSP enabled
				});*/
		//},

		/*	onSucessExport: function(oEvent){
				console.log(oEvent);
			},
			onErrorExport: function(oEvent){
				console.log(oEvent);
			}

			exportSpreadsheet: function (settings, fnSuccess, fnFail) {
				return new Spreadsheet(settings)
					.build()
					.catch(fnFail ? fnFail.bind(this) : null)
					.then(fnSuccess ? fnSuccess.bind(this) : null);
			},*/

		showMessageBoxConfirmation: function (sMessage, oSolicitacao, sEvento) {
			var that = this;
			MessageBox.warning(
				sMessage, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.OK) {
							that.finalizaSolicitacao(oSolicitacao, sEvento);
						}
					}
				}
			);
		},

		finalizaSolicitacao: function (oSolicitacao, sEvento) {
			var that = this,
				oParams = {};

			oParams = {
				"NumSolic": oSolicitacao.procuradorData.NumSolic,
				"Status": "",
				"Situacao": "",
				"Evento": sEvento,
				"AnexoSet": []
			};

			that.oParams = oParams;
			that.sendSolicitacao(that.oParams, sEvento);

		},

		getDialogDefineProc: function (sFragment) {
			if (!this._oDialogDefProc) {
				this._oDialogDefProc = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogDefProc);
			}

			return this._oDialogDefProc;
		},

		getDialogProcuradores: function (sFragment) {
			if (!this._oDialogProc) {
				this._oDialogProc = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogProc);
			}

			return this._oDialogDefProc;
		},
		
		getDialogSolicitantes: function (sFragment) {
			if (!this._oDialogSolic) {
				this._oDialogSolic = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogSolic);
			}
			return this._oDialogSolic;
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

		onDialogDefineProcConfirm: function () {

			var oModel = this.getModel(),
				that = this,
				oOwnerComponent = this.getOwnerComponent(),
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			if (this._validateField("txtProcurador")) {
				oOwnerComponent.showBusyIndicator();
				var entitySet = "/DefinirProcuradorSet";
				var oParams = {
					Matricula: structureApp.procuradorData.Matricula,
					NumSolic: structureApp.procuradorData.NumSolic
				};

				oModel.create(entitySet, oParams, {
					success: function (oData) {
						oOwnerComponent.hideBusyIndicator();
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText("advogado_definido_sucesso"));
						that.oDialogDefineProc.close();
					},
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
						that.getOwnerComponent()._genericErrorMessage(that.geti18nText("solicitacao_erro"));
						that.getOwnerComponent().hideBusyIndicator();
					}
				});
				//atualiza a tabela de solicitações
				var oTable = this.getOwnerComponent().oListSolicGerenciador;
				oTable.getBinding("items").refresh(true);
			}
		},
		onDialogDefineProcClose: function () {
			this.oDialogDefineProc.close();
		},
		_onOpenDialogProcurador: function (oEvent) {
			var oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				oModel = this.getModel(),
				that = this;

			if (!oView.getModel("procuradores")) {
				oOwnerComponent.showBusyIndicator();

				oModel.read("/ProcuradoresSet", {

					success: function (oData) {

						var oAprovModel = new JSONModel(oData);
						oView.setModel(oAprovModel, "procuradores");
						oOwnerComponent.hideBusyIndicator();
						that._oDialogProc.open();
					},
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(that.geti18nText("load_advogados_erro"));
					}

				});

			} else {
				this._oDialogProc.open();
				oOwnerComponent.hideBusyIndicator();
			}
		},

		_onSearchProc: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"Nome",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
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
			var oFilter = new Filter(
				"Nome",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		_onTableItemSolicPress: function (oEvent) {
			var oSelItem = oEvent.getParameter("selectedItem"),
				ofilterModel = this.getModel("filterModel"),
				oFilterGer = ofilterModel.getProperty("/gerenciador");

			var oSolicitante = this.getModel("solicitantes").getObject(oSelItem.getBindingContextPath());
				oFilterGer.solicitante = oSolicitante.Nome;
				ofilterModel.setProperty("/gerenciador", oFilterGer);
			
		},

		_validateField: function (fieldName) {

			var oControl = this.getView().byId(fieldName);
			if (!oControl) {
				oControl = sap.ui.getCore().byId(fieldName);
			}

			var value;

			if (fieldName.substring(0, 3) === "sel") {
				value = oControl.getSelectedKey();
				if (value === "") {
					oControl.setValueState("Error");
					oControl.setValueStateText(this.geti18nText("campo_obrigatorio_txt"));
					MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
					return false;
				}
			} else {
				value = oControl.getValue();
				if (value === "") {
					oControl.setValueState("Error");
					oControl.setValueStateText(this.geti18nText("campo_obrigatorio_txt"));
					MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
					return false;
				}
			}
			oControl.setValueState("None");
			return true;
		},

		sendSolicitacao: function (oParams, sAction) {
			this.getOwnerComponent().showBusyIndicator();
			var that = this,
				oModel = this.getModel(),
				sText = "",
				entitySet = "/GravarContratoJuridicoSet";

			oModel.create(entitySet, oParams, {
				success: function (oData) {
					var iNumSol = parseInt(oData.NumSolic, 10);
					if (sAction === "F") {
						sText = that.geti18nText("finalizada_txt");
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText1("solicitacao_encerrada_sucesso_msg", [iNumSol, sText]));
					}
					if (sAction === "C") {
						sText = that.geti18nText("cancelada_txt");
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText1("solicitacao_encerrada_sucesso_msg", [iNumSol, sText]));
					}
					that.getOwnerComponent().hideBusyIndicator();
					oModel.refresh();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("solicitacao_erro"));
					that.getOwnerComponent().hideBusyIndicator();
					oModel.refresh(true);
				}
			});

		}

	});
});