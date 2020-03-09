sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"com/sap/build/sapcsr/SOLCONT/model/formatter",
	"sap/m/MessageToast"
], function (BaseController, MessageBox, History, ValueHelpDialog, Filter, FilterOperator, JSONModel, Device, formatter, MessageToast) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.Solicitacoes", {
		formatter: formatter,

		onInit: function () {
			this._getLoggedUser();

			this.getOwnerComponent().oListSolic = this.getView().byId("tbSolicitacoes");
			this.oDialogProcuradores = this.getDialogProcuradores("com.sap.build.sapcsr.SOLCONT.view.fragments.Procuradores");
			
			var oView = this.getView();

			oView.addEventDelegate({
				onBeforeShow: function (oEvent) {
					this.getUserData();
				}.bind(this)
			});
			
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		},
		
		handlePopoverPress: function (oEvent) {

			var index = oEvent.getSource().getBindingContext().sPath.split("'")[1];
			this.getOwnerComponent().IdSolic = parseInt(index,10);

			var oContext = oEvent.getSource().getBindingContext(),
				oObject = this.getModel().getObject(oContext.getPath()),
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
		
		_onCriarAlt: function(oEvent){
			var structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				iNumSol = parseInt(structureApp.procuradorData.NumSolic,10),
				sFinalText = this.geti18nText("finalizacao_txt"),
				sMessage = this.geti18nText1("confirm_finaliza_sol_msg", [sFinalText,iNumSol]);
			
			this.showMessageBoxConfirmation(sMessage, structureApp,"F");
		},
		
		_onCancelar: function(oEvent){
				var structureAppModel = this.getModel("structureApp"),
					structureApp = structureAppModel.getData(),
					iNumSol = parseInt(structureApp.procuradorData.NumSolic,10),
					sFinalText = this.geti18nText("cancelamento_txt"),
					sMessage = this.geti18nText1("confirm_finaliza_sol_msg", [sFinalText,iNumSol]);
			
				this.showMessageBoxConfirmation(sMessage, structureApp,"C");
		},

		_onEParecer: function (oEvent) {
			this.getRouter().navTo("Parecer", {
				IdSolic: this.getOwnerComponent().IdSolic
			});
		},

		_onVizualizar: function (oEvent) {
			this.showBusy();
			this.getRouter().navTo("contrato", {
				IdSolic: this.getOwnerComponent().IdSolic
			});
		},
		
		_onAlterar: function (oEvent){
			this.showBusy();
			this.getRouter().navTo("contrato",{
				IdSolic: this.getOwnerComponent().IdSolic
			});
		},

		_onDefineProc: function (oEvent) {
			this.oDialogDefineProc = this.getDialogDefineProc("com.sap.build.sapcsr.SOLCONT.view.fragments.DefineProcurador");
			this.oDialogDefineProc.open();

		},
		
		showMessageBoxConfirmation: function(sMessage, oSolicitacao, sEvento){
			var that = this;
			MessageBox.warning(
				sMessage,
				{
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: function(sAction) {
						if(sAction === sap.m.MessageBox.Action.OK){
							that.finalizaSolicitacao(oSolicitacao,sEvento);
						}
					}
				}
			);
		},
		
		finalizaSolicitacao: function(oSolicitacao, sEvento){
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
				var oTable = this.getOwnerComponent().oListSolic;
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
					var iNumSol = parseInt(oData.NumSolic,10);
					if (sAction === "F") {
						sText = that.geti18nText("finalizada_txt");
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText1("solicitacao_encerrada_sucesso_msg", [iNumSol,sText]));
					} 
					if (sAction === "C") {
						sText = that.geti18nText("cancelada_txt");
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText1("solicitacao_encerrada_sucesso_msg", [iNumSol,sText]));
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

		},

		/***********************
		 *  PEGA USUÁRIO LOGADO
		 ************************/
		_getLoggedUser: function (oParams) {
			var oController = this;

			$.ajax({
				url: "/sap/opu/odata/SAP/ZTRIP_SRV/ET_INITINFOSet('')",
				data: JSON.stringify(oParams),
				dataType: "json",
				success: function (data) {
					oController.getOwnerComponent().hideBusyIndicator();
					oController.getOwnerComponent().user = data.d.NomeUsuario;
					oController.getOwnerComponent().CentroCusto = data.d.Kostl;
					oController.getOwnerComponent().Gerencia = data.d.Desc_Kost;
					oController.getOwnerComponent().Telefone = data.d.Telefone;
				},
				error: function () {
					oController.getOwnerComponent()._genericErrorMessage(oController.geti18nText("requisicao_erro"));
				},
				type: "GET"
			});
		}
	});
}, /* bExport= */ true);