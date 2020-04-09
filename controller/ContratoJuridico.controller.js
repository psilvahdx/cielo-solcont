sap.ui.define([
	"jquery.sap.global",
	"./BaseController",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/model/SimpleType",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/ValidateException",
	"sap/ui/Device",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"com/sap/build/sapcsr/SOLCONT/model/formatter",
	"com/sap/build/sapcsr/SOLCONT/model/jqueryMask"
], function (jQuery, BaseController, History, MessageBox, ODataModel, Filter, FilterOperator, MessageToast, SimpleType, UIComponent,
	JSONModel, ValidateException, Device, ValueHelpDialog, formatter, jqueryMask) {
	"use strict";

	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.ContratoJuridico", {
		formatter: formatter,
		sNumSolicitacao: "",

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
			this.oRouter.getRoute("contrato").attachPatternMatched(this._onRouteMatched, this);
		},

		//função que copia todos os dados do oData para os campos na tela, e as imagens
		_onRouteMatched: function (oEvent) {
			var oArgs,
				sPath,
				that = this,
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData(),
				oView = this.getView();

			this.getView().unbindElement();
			this.getView().byId("txtAdvogadoResp").setText("");
			this.getView().byId("cmbResponsavel").setSelectedKey("1");

			oArgs = oEvent.getParameter("arguments");
			sPath = oArgs.IdSolic;

			if (sPath !== "New") {
				this.sNumSolicitacao = sPath;
				structureApp.solViewModel.fowardEnabled = true;
				structureAppModel.refresh();
				this.getView().bindElement({
					path: "/GravarContratoJuridicoSet('".concat(sPath).concat("')"),
					parameters: {
						expand: "AnexoSet"
					},
					events: {
						dataReceived: function (oEvent) {
							that.hideBusy();
							var oContext = oEvent.getSource().getBoundContext(),
								oViewModel = this.getModel().getObject(oContext.getPath());

							var oJsonModel = new JSONModel(oViewModel);
							that.getView().setModel(oJsonModel, "viewModel");

							if (oViewModel.Evento === "S" || oViewModel.Evento === "") {
								structureApp.solViewModel.enabled = true;
							} else if (structureApp.userData.Perfil === "ADMIN") {
								structureApp.solViewModel.enabled = true;
							} else {
								structureApp.solViewModel.enabled = false;
							}
							structureApp.solViewModel.fowardEnabled = true;
							//structureAppModel.setData(structureApp);
							structureAppModel.refresh();

							if (oViewModel.NumAdvogado !== "00000000") {
								that.getAdvogadoResponsavel(oViewModel.NumAdvogado);
							}
							structureAppModel.refresh();
						}
					}
				});
			} else {
				this.sNumSolicitacao = "";
				structureApp.solViewModel.enabled = true;
				structureApp.solViewModel.fowardEnabled = false;
				//structureAppModel.setData(structureApp);
				structureAppModel.refresh();
				this.setInitialValues();
			}

		},

		getAdvogadoResponsavel: function (sMatricula) {

			var that = this,
				oModel = this.getModel();

			oModel.read(oModel.createKey("/ProcuradoresSet", {
				Matricula: sMatricula
			}), {
				success: function (oData) {
					var oAdvogadoModel = new JSONModel(oData);
					that.getView().byId("txtAdvogadoResp").setText(oAdvogadoModel.getProperty("/Nome"));
					that.getView().setModel(oAdvogadoModel, "advogadoRespModel");
				},
				error: function (oError) {
					that.getView().byId("txtAdvogadoResp").setText("");
				}
			});

		},

		getFornecedorByCnpj: function (sCnpj) {

			var that = this,
				oModel = this.getModel();

			oModel.read(oModel.createKey("/FornecedorSet", {
				IvCnpj: sCnpj
			}), {
				success: function (oData) {
					var oFornecedorModel = new JSONModel(oData);
					that.getView().byId("inpRazao").setValue(oFornecedorModel.getProperty("/EvFornecedor"));
					that.getOwnerComponent().hideBusyIndicator();
				},
				error: function (oError) {
					that.getView().byId("inpRazao").setValue("");
					that.getOwnerComponent().hideBusyIndicator();
				}
			});

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

			var strCnpjNew = oEvent.getParameter("newValue");

			/*if(this.validarCNPJ(strCnpjNew)){
				this.getView().byId("inpCNPJ").setValueState("None");
			}
			else{
				this.getView().byId("inpCNPJ").setValueState("Error");
			}*/

			strCnpjNew = this.retirarFormatacao(strCnpjNew);

			if (strCnpjNew.length === 14) {
				this.getView().byId("inpCNPJ").setValueState("None");
				this.getOwnerComponent().showBusyIndicator();
				this.getFornecedorByCnpj(strCnpjNew);
			} else {
				this.getView().byId("inpCNPJ").setValueState("Error");
				this.getView().byId("inpRazao").setValue("");
				this.getOwnerComponent().hideBusyIndicator();
			}

		},

		onCnpjParteRelLiveChange: function (oEvent) {

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

		setInitialValues: function () {

			//data atual
			var today = new Date();
			this.byId("dtSolic").setValue(today.toLocaleDateString());
			this.byId("inpDtVigenciaDe").setValue("");
			this.byId("inpDtVigenciaAte").setValue("");
			this.byId("inpSegundoA").setValue("");
			this.byId("inpParteRelac").setValue("");

			//Pega os dados de centro de custo e km do usuario logado
			var oView = this.getView(),
				oCentroCusto = oView.byId("inpCentroC"),
				oGerencia = oView.byId("inpGerencia"),
				oBeneficiario = oView.byId("txtSolicitante"),
				oTelefone = oView.byId("txtTelefone"),
				structureAppModel = this.getModel("structureApp"),
				structureApp = structureAppModel.getData();

			oBeneficiario.setText("" + structureApp.userData.Nome + "");
			//oCentroCusto.setValue("" + structureApp.userData.CentroCusto + "");
			//oGerencia.setValue("" + structureApp.userData.Gerencia + "");
			oTelefone.setText("" + structureApp.userData.Telefone + "");

			this.byId("chekCompras").setSelected(false);
			this.byId("checkComplice").setSelected(false);

			sap.ui.getCore().fileUploadArr = [];

		},
		/********************************
		 * Valida os campos obrigatórios
		 *********************************/
		_validateForm: function () {
			var isValid = true;

			if (!this._validateField("cmbEmpresa"))
				isValid = false;

			if (!this._validateField("cmbSolicitacao"))
				isValid = false;

			//if (!this._validateField("cmbDocumento"))
			//	isValid = false;
			if(!this._validateField("inpTpDoc"))
				isValid = false;

			if (!this._validateField("inpSegundoA"))
				isValid = false;

			if (!this._validateField("inpCentroC"))
				isValid = false;

			if (!this._validateField("inpGerencia"))
				isValid = false;

			if (this.getView().byId("chekCompras").getSelected()) {

				if (!this._validateField("cmbResponsavel"))
					isValid = false;
			}

			if (!this._validateField("inpRazao"))
				isValid = false;

			if (!this._validateField("inpCNPJ"))
				isValid = false;

			if (!this._validateField("txtADes"))
				isValid = false;

			return isValid;
		},

		_validateField: function (fieldName) {

			var oControl = this.getView().byId(fieldName);
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

		/***********************
		 *  Envia solicitação 
		 ************************/

		onSubmit: function () {
			this.oParams = this.getParamsToSubmit("S");
			this.sendSolicitacao(this.oParams, "S");
		},

		onPressEncaminhar: function (oEvent) {
			if (this._validateForm()) {
				this.oParams = this.getParamsToSubmit("E");
				this.sendSolicitacao(this.oParams, "E");
			}
		},

		getParamsToSubmit: function (sEvento) {

			var oView = this.getView();
			var oParams = new Object();
			var that = this;
			var today = new Date();
			var oValor = oView.byId("inpValor");
			var listaUpload = this.getView().byId("UploadCollection");
			var aArquivos = sap.ui.getCore().fileUploadArr;
			var aFiles = new Array();
			var oArquivo;
			var oFiles = new Array();
			var oViewModel = this.getView().getModel("viewModel");

			//Datas
			var oDtSol = oView.byId("dtSolic").getDateValue(),
				oDtViIni = oView.byId("inpDtVigenciaDe").getDateValue(),
				oDtViFim = oView.byId("inpDtVigenciaAte").getDateValue();

			if (!oDtSol) {
				var sDtSol = oView.byId("dtSolic").getValue();
				sDtSol = sDtSol.trim();
				if (sDtSol) {
					oDtSol = new Date(sDtSol.substring(3, 5) + "/" +
						sDtSol.substring(0, 2) + "/" +
						sDtSol.substring(6, 10)
					);
				}

			}
			if (!oDtViIni) {
				var sDtViIni = oView.byId("inpDtVigenciaDe").getValue();
				sDtViIni = sDtViIni.trim();
				if (sDtViIni) {
					oDtViIni = new Date(sDtViIni.substring(3, 5) + "/" +
						sDtViIni.substring(0, 2) + "/" +
						sDtViIni.substring(6, 10)
					);
				}

			}
			if (!oDtViFim) {
				var sDtViFim = oView.byId("inpDtVigenciaAte").getValue();
				sDtViFim = sDtViFim.trim();
				if (sDtViFim) {
					oDtViFim = new Date(sDtViFim.substring(3, 5) + "/" +
						sDtViFim.substring(0, 2) + "/" +
						sDtViFim.substring(6, 10)
					);
				}
			}

			//anexos
			jQuery.each(aArquivos, function (i, oFile) {

				oArquivo = {
					"Idanexo": "00",
					"Zfilename": oFile.FileName,
					"Zfiletype": oFile.MimeType,
					"Zcontents": oFile.Content,
					"Numsolic": "000"
				};
				oFiles.push(oArquivo);
			});

			if (listaUpload.getItems().length !== oFiles.length) {

				for (var j = 0; j < listaUpload.getItems().length; j++) {
					aFiles.push(...oFiles.filter(function (arquivo) {
						return arquivo.Zfilename === listaUpload.aItems[j].getFileName();
					}));
				}
			}

			if (aFiles.length === 0) {
				aFiles = oFiles;
			}

			var sCnpjunmask = this.retirarFormatacao(oView.byId("inpCNPJ").getValue()),
				oAdvogadoModel = oView.getModel("advogadoRespModel"),
				oAprovModel = oView.getModel("selectedAprovador"),
				oSelectedParteRel = oView.getModel("SelectedParteRel"),
				oSelectedTpDoc = oView.getModel("SelectedTpDoc"),
				sNumAdvogadoResp = oAdvogadoModel ? oAdvogadoModel.getProperty("/Matricula") : "",
				sAprovadorID = oAprovModel ? oAprovModel.getProperty("/Matricula") : "",
				sParteRelID = oSelectedParteRel ? oSelectedParteRel.getProperty("/Id") : "",
				sIdTpDoc = oSelectedTpDoc ? oSelectedTpDoc.getProperty("/Id") : "",
				sTpDoc = oSelectedTpDoc ? oSelectedTpDoc.getProperty("/Descricao") : "",
				sNumRespCompras = oView.byId("cmbResponsavel").getSelectedKey();

			if (sAprovadorID === "") {
				sAprovadorID = oViewModel ? oViewModel.getProperty("/NumSegAprov") : "";
			}

			if (sParteRelID === "") {
				sParteRelID = oViewModel ? oViewModel.getProperty("/IdParteRelacionada") : "";
			}
			
			if (sIdTpDoc === "") {
				sIdTpDoc = oViewModel ? oViewModel.getProperty("/IdTipoDoc") : "";
			}
			
			if (sTpDoc === "") {
				sTpDoc = oViewModel ? oViewModel.getProperty("/TpDoc") : "";
			}

			oParams = {
				"NumSolic": this.sNumSolicitacao,
				"DtSolic": oDtSol ? oDtSol : "", //oView.byId("dtSolic").getDateValue(),
				"Empresa": oView.byId("cmbEmpresa").getValue(),
				"TpSolic": oView.byId("cmbSolicitacao").getValue(),
				"TpDoc": sTpDoc,//oView.byId("cmbDocumento").getValue(),
				"DescSolic": oView.byId("txtADes").getValue(),
				"NContrato": oView.byId("inpNContrato").getValue(),
				"NRc": oView.byId("inpNRC").getValue(),
				"SegApr": oView.byId("inpSegundoA").getValue(),
				"UsrSolic": oViewModel ? oViewModel.getProperty("/UsrSolic") : "",
				"Solicitante": oView.byId("txtSolicitante").getText(),
				"Telefone": oView.byId("txtTelefone").getText().trim(),
				"CCusto": oView.byId("inpCentroC").getValue(),
				"Gerencia": oView.byId("inpGerencia").getValue(),
				"RespCompras": oView.byId("cmbResponsavel").getValue(),
				"RazaoSoc": oView.byId("inpRazao").getValue(),
				"CnpjCpf": sCnpjunmask,
				"DescContratacao": oView.byId("txtADescricao").getValue(),
				"Status": oViewModel ? oViewModel.getProperty("/Status") : "",
				"Situacao": oViewModel ? oViewModel.getProperty("/Situacao") : "",
				"SendCompras": oView.byId("chekCompras").getSelected(), //oViewModel ? oViewModel.getProperty("SendCompras") : "",
				"SendComplice": oView.byId("checkComplice").getSelected(), //oViewModel ? oViewModel.getProperty("SendComplice") : "",
				"Valor": oValor.getValue() ? (oValor.data("convertedValue") ? oValor.data("convertedValue") : oValor.getValue().replace(",", ".")) : "0.00",
				"AnexoSet": aFiles,
				"NumAdvogado": sNumAdvogadoResp ? sNumAdvogadoResp : "",
				"IdEmpresa": oView.byId("cmbEmpresa").getSelectedKey(),
				"IdTipoSol": oView.byId("cmbSolicitacao").getSelectedKey(),
				"IdTipoDoc": sIdTpDoc, //oView.byId("cmbDocumento").getSelectedKey(),
				"Evento": sEvento,
				//"NaturezaContrato": oView.byId("cmbNatCont").getSelectedKey(),
				"DtVigenciaIni": oDtViIni, //oView.byId("inpDtVigenciaDe").getDateValue(),
				"DtVigenciaFim": oDtViFim, //oView.byId("inpDtVigenciaAte").getDateValue(),
				"FormVigencia": oView.byId("inpFormVig").getValue(),
				"NumSegAprov": sAprovadorID ? sAprovadorID : "",
				"NumRespCompras": sNumRespCompras,
				"IdParteRelacionada": sParteRelID
			};

			return oParams;

		},

		sendSolicitacao: function (oParams, sAction) {
			this.getOwnerComponent().showBusyIndicator();
			sap.ui.getCore().fileUploadArr = [];
			var that = this,
				oModel = this.getModel(),
				entitySet = "/GravarContratoJuridicoSet";

			oModel.create(entitySet, oParams, {
				success: function (oData) {
					that.getOwnerComponent().hideBusyIndicator();
					var iNumSol = parseInt(oData.NumSolic);
					if (sAction === "S") {
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText1("solicitacao_sucesso_msg", [iNumSol]));
					} else {
						that.getOwnerComponent()._genericSuccessMessage(that.geti18nText1("enc_solicitacao_sucesso_msg", [iNumSol]));
					}

					oModel.refresh();

					if (sAction === "E") {
						setTimeout(function () {
							that.navToSolicitacoes();
						}.bind(that), 2000);
					} else {
						that.readSolicitacao(oData.NumSolic);
						/*	if (that.sNumSolicitacao === "") {
								if (oData.NumSolic !== "") {
									that.readSolicitacao(oData.NumSolic);
								}
							}*/
					}

				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("solicitacao_erro"));
					that.getOwnerComponent().hideBusyIndicator();
					oModel.refresh(true);
				}
			});

		},

		readSolicitacao: function (sPath) {

			this.getRouter().navTo("contrato", {
				IdSolic: sPath
			});

		},
		navToSolicitacoes: function () {
			this.getRouter().navTo("solicitacoes");
		},

		/***********************
		 *  Quando clica em CANCELAR solicitação 
		 ************************/
		_onCancel: function (oEvent) {
			this.getView().unbindElement();
			//history.go(-1);
			this.navToSolicitacoes();
		},

		onCancel: function () {
			var oView = this.getView();
			var oEmpresa = oView.byId("cmbEmpresa");
			var oTPSolic = oView.byId("cmbSolicitacao");
			var oTPDoc = oView.byId("cmbDocumento");
			var oDesc = oView.byId("txtADes");
			var oValor = oView.byId("inpValor");
			var oContrato = oView.byId("inpNContrato");
			var oRC = oView.byId("inpNRC");
			var oSegundoA = oView.byId("inpSegundoA");
			var oCC = oView.byId("inpCentroC");
			var oGerencia = oView.byId("inpGerencia");
			var oResponsavel = oView.byId("cmbResponsavel");
			var oRazaoSocial = oView.byId("inpRazao");
			var oCNPJ = oView.byId("inpCNPJ");
			var oDescContratacao = oView.byId("txtADescricao");

			oEmpresa.setValue("");
			oTPSolic.setValue("");
			oTPDoc.setValue("");
			oDesc.setValue("");
			oValor.setValue("");
			oContrato.setValue("");
			oRC.setValue("");
			oSegundoA.setValue("");
			oCC.setValue("");
			oGerencia.setValue("");
			oResponsavel.setValue("");
			oRazaoSocial.setValue("");
			oCNPJ.setValue("");
			oDescContratacao.setValue("");

			//anexos
			var oUploadCollection = oView.byId('UploadCollection'),
				aItems = oUploadCollection.getItems();

			jQuery.each(aItems, function (i, oItem) {
				oUploadCollection.removeItem(oItem);
				oUploadCollection.destroyItems(oItem);
			});

			sap.ui.getCore().fileUploadArr = undefined;

		},

		/***********************
		 *  converte o campo valor em moeda 
		 ************************/
		currency: function (oEvent, oValor) {
			var oInput = oEvent !== "" ? oEvent.getSource() : oValor;
			var sValor = oInput.getValue();

			sValor = sValor.split(",").join("");
			var sArray = sValor.split("");

			if (isNaN(parseInt(sValor[sValor.length - 1]))) {
				sArray.pop();
			}
			var sValorNovo = "";
			if (sArray[0] === "0") {
				if (sArray[1] === "0") {
					sArray.shift(0);
				}
				sArray.shift(0);
			}
			if (sArray.length > 2) {
				for (var i = 0; i < sArray.length - 2; i++) {
					sValorNovo += sArray[i];
				}
				sValorNovo += "," + sArray[sArray.length - 2] + sArray[sArray.length - 1];
				if (sValorNovo[0] === ",") {
					var aNovoValor;
					for (var i; i < sValorNovo.length; i++) {
						if (i === 0) {
							aNovoValor[0] = "0";
						} else {
							aNovoValor[i] = sValorNovo[i - 1];
						}
					}
					aNovoValor.push(sValorNovo[sValorNovo.length - 1]);
					sValorNovo = aNovoValor;
				}

				oInput.setValue(sValorNovo);
			} else {
				if (sArray.length === 1) {
					oInput.setValue("0,0" + sArray[0]);
				} else {
					if (sArray.length > 0) {
						oInput.setValue("0," + sArray[0] + sArray[1]);
					} else {
						oInput.setValue("0,00");
					}
				}
			}
		},
		
		/********************************************
		 *   DIALOG PARA SELEÇÃO DE CENTRO DE CUSTO
		 **********************************************/

		getDialogCentroCusto: function (sFragment) {
			if (!this._oDialogCC) {
				this._oDialogCC = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogCC);
			}

			return this._oDialogCC;
		},

		_onOpenDialogCC: function () {
			var oView = this.getView();
			var oOwnerComponent = this.getOwnerComponent();
			var oController = this;
			this.oDialogCentroCusto = this.getDialogCentroCusto("com.sap.build.sapcsr.SOLCONT.view.fragments.CentroCusto");
			oOwnerComponent.showBusyIndicator();
			if (!oView.getModel("CentroCustos")) {
				oOwnerComponent.showBusyIndicator();
				$.ajax({
					url: "/sap/opu/odata/SAP/ZTRIP_SRV/ET_CENTROS_CUSTOSet?$format=json",
					success: function (oResponse) {
						oController.oCentroCusto = oResponse.d;
						var oModel = new JSONModel(oController.oCentroCusto);
						oView.setModel(oModel, "centroCusto");
						oOwnerComponent.hideBusyIndicator();
						oController.oDialogCentroCusto.open();
					},
					error: function (oResponse) {
						oOwnerComponent.hideBusyIndicator();
						oController._oCentroCustoModalDialog.open();
						oOwnerComponent._genericErrorMessage(oController.geti18nText("centro_custo_error_load_msg"));
					},
					type: 'GET'
				});
			} else {
				this.oDialogCentroCusto.open();
			}

		},

		_onDialogCCClose: function () {
			this.oDialogCentroCusto.close();
		},

		_onTableItemCCPress: function (oEvent) {
			var oController = this;
			var oCC = this.getView().byId("inpCentroC");
			var odesc = this.getView().byId("inpGerencia");
			var aContexts = oEvent.getParameter("selectedContexts");
			var centroCustoId = aContexts.map(function (oContext) {
				return oContext.getObject();
			});
			var oTextCC = oController.formatter.textName(centroCustoId[0].Ltext);
			oCC.setValue(centroCustoId[0].Kostl);
			odesc.setValue(oTextCC);
		},

		_onSearchCC: function (oEvent) {
			var sQuery = oEvent.getParameter("query");

			var oFilter = new Filter({
				filters: [
					new Filter("Ltext", sap.ui.model.FilterOperator.Contains, sQuery),
					new Filter("Kostl", sap.ui.model.FilterOperator.Contains, sQuery)
				]
			});
			var oTbl = sap.ui.getCore().byId("tblCentroCusto");
			var oBinding = oTbl.getBinding("items");
			oBinding.filter([oFilter]);
		},

		/*****************************************************************
		 * Exclui o texto de gerencia se o input Centro de custo for modificado
		 ******************************************************************/
		_onChangeCC: function (oEvent) {
			var oController = this,
				oView = oController.getView(),
				oInput = oEvent.getSource();

			var descricaoCC = oView.byId("inpGerencia");

			if (oInput) {
				descricaoCC.setValue("");
				// oInput.setValueStateText("Entre com um Centro de Custo válido");
				// oInput.setValueState("Warning");
			}
		},

		/***************************************************************
		 * Abrir Value Help de contrato
		 * @param {object} [oEvent] 
		 **************************************************************/
		openDialogContrato: function (oEvent) {
			var that = this;
			var oModel = this.getView().getModel();
			var oValueHelpDialog = new ValueHelpDialog({
				title: this.geti18nText("busca_contrato_txt"),
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,
				key: "ContratoCodigo",
				descriptionKey: "ContratoNome",
				// Seleciona o item
				ok: function (oControlEvent) {
					var key = oControlEvent.getParameter("tokens")[0].getKey();
					oValueHelpDialog.close();
				},

				cancel: function (oControlEvent) {
					oValueHelpDialog.close();
				},
				afterClose: function () {
					oValueHelpDialog.destroy();
				}
			});

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: [{
					label: this.geti18nText("num_solicitacao_lbl"),
					template: "solicitacao"
				}, {
					label: this.geti18nText("num_contrato_lbl"),
					template: "contrato"
				}, {
					label: this.geti18nText("razao_social_txt"),
					template: "RS"
				}, {
					label: this.geti18nText("cnpj_cpf_lbl"),
					template: "cnpjcpf"
				}]
			});
			oValueHelpDialog.getTable().setModel(oColModel, "columns");
			
			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				filterBarExpanded: true,
				useToolbar: false,
				showGoOnFB: true,
				showRestoreOnFB: false,
				showClearOnFB: false,
				showFilterConfiguration: false,
				showRestoreButton: false,
				showClearButton: false,

				filterItems: [new sap.ui.comp.filterbar.FilterItem({
						name: "fiContrato",
						label: this.geti18nText("contrato_lbl"),
						control: new sap.m.Input("inFbContrato", {
							type: "Text"
						})
					}),
					new sap.ui.comp.filterbar.FilterItem({
						name: "fiNSolic",
						label: this.geti18nText("num_solicitacao_lbl"),
						control: new sap.m.Input("inFbNSolic", {
							type: "Text"
						})
					}),
					new sap.ui.comp.filterbar.FilterItem({
						name: "fiCNPJCPF",
						label: this.geti18nText("cnpj_cpf_lbl"),
						control: new sap.m.Input("inFbCnpjcpf")
					})

				],
				// Busca
				search: function (oEvent) {
					var ccusto = oEvent.getParameter("selectionSet")[0].getValue();
					var gerencia = oEvent.getParameter("selectionSet")[1].getValue();
					var gerente = oEvent.getParameter("selectionSet")[2].getValue();

					var oTable = oValueHelpDialog.getTable();
					var oBinding = oTable.getBinding("rows");

					var oFilters = [];
					if (ccusto != "")
						oFilters.push(new Filter("CentroCusto", FilterOperator.EQ, ccusto));

					if (gerencia != "")
						oFilters.push(new Filter("AreaNome", FilterOperator.EQ, gerencia));

					if (gerente != "")
						oFilters.push(new Filter("GerenteNome", FilterOperator.EQ, gerente));
					oBinding.filter(oFilters);

				}
			});

			oValueHelpDialog.setFilterBar(oFilterBar);

			oValueHelpDialog.open();
			oValueHelpDialog.update();

		},

		/*ANEXOS*/
		// When user select the file then this method will call....
		handleSelectFile: function (oEvent) {
			var fileDetails = oEvent.getParameters("file").files[0];
			if (sap.ui.getCore().fileUploadArr === undefined)
				sap.ui.getCore().fileUploadArr = [];
			if (fileDetails) {
				var mimeDet = fileDetails.type,
					fileName = fileDetails.name;

				// Calling method....
				this.base64coonversionMethod(mimeDet, fileName, fileDetails, "001");
			} else {
				sap.ui.getCore().fileUploadArr = [];
			}
		},

		// Base64 conversion of selected file(Called method)....
		base64coonversionMethod: function (fileMime, fileName, fileDetails, DocNum) {
			var that = this;
			if (!FileReader.prototype.readAsBinaryString) {
				FileReader.prototype.readAsBinaryString = function (fileData) {
					var binary = "";
					var reader = new FileReader();
					reader.onload = function (e) {
						var bytes = new Uint8Array(reader.result);
						var length = bytes.byteLength;
						for (var i = 0; i < length; i++) {
							binary += String.fromCharCode(bytes[i]);
						}
						that.base64ConversionRes = btoa(binary);
						sap.ui.getCore().fileUploadArr.push({
							"DocumentType": DocNum,
							"MimeType": fileMime,
							"FileName": fileName,
							"Content": that.base64ConversionRes
						});
					};
					reader.readAsArrayBuffer(fileData);
				};
			}
			var reader = new FileReader();
			reader.onload = function (readerEvt) {
				var binaryString = readerEvt.target.result;
				that.base64ConversionRes = btoa(binaryString);
				sap.ui.getCore().fileUploadArr.push({
					"DocumentType": DocNum,
					"MimeType": fileMime,
					"FileName": fileName,
					"Content": that.base64ConversionRes,

				});
			};
			reader.readAsBinaryString(fileDetails);
		},

		handleShowFile: function (oEvent) {

			//pega o conteúdo do arquivo
			var fname = oEvent.getSource().getFileName(),
				ftype = oEvent.getSource().getMimeType(),
				oContext = oEvent.getSource().getBindingContext(),
				oFile = this.getModel().getObject(oContext.getPath());

			var base64str = oFile.Zcontents;

			// decode base64 string, remove space for IE compatibility
			var binary = atob(base64str.replace(/\s/g, ''));
			var len = binary.length;
			var buffer = new ArrayBuffer(len);
			var view = new Uint8Array(buffer);
			for (var i = 0; i < len; i++) {
				view[i] = binary.charCodeAt(i);
			}

			// create the blob object with content-type "application/pdf"               
			var blob = new Blob([view], {
				type: ftype
			});

			var url = URL.createObjectURL(blob);

			window.open(url, '_blank');
		},

		fnFileDeleted: function (oEvent) {
			var that = this,
				sMsg = "",
				oModel = this.getModel(),
				oContext = oEvent.getSource().getBindingContext(),
				oFile = this.getModel().getObject(oContext.getPath());

			if (oFile) {

				sap.m.MessageBox.warning(
					this.geti18nText1("confirm_excluir_file", [oFile.Zfilename]), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
						onClose: function (sAction) {
							if (sAction === sap.m.MessageBox.Action.YES) {
								that.showBusy();
								oModel.remove(oModel.createKey("/AnexoSet", {
									Numsolic: oFile.Numsolic,
									Idanexo: oFile.Idanexo
								}), {
									success: function (oData) {
										that.hideBusy();
										sMsg = that.geti18nText("arquivo_excluido_sucess_msg");
										that.getOwnerComponent()._genericSuccessMessage(sMsg);
									},
									error: function (oError) {
										that.hideBusy();
										sMsg = that.geti18nText("arquivo_excluido_error_msg");
										that.getOwnerComponent()._genericErrorMessage(sMsg);
									}
								});
							}
						}
					}
				);

			}

		},

		checkCompra: function (oEvent) {
			var oSelecionado = oEvent.getSource();
			var respCompras = this.getView().byId("cmbResponsavel");

			if (oSelecionado.getSelected() === true) {
				respCompras.setEnabled(true);
			} else {
				respCompras.setEnabled(false);
				respCompras.setValue("");
			}
		},

		onCheckCompliance: function (oEvent) {
			var oSelecionado = oEvent.getSource();
			var parteRel = this.getView().byId("inpParteRelac");

			if (oSelecionado.getSelected() === true) {
				parteRel.setEnabled(true);
			} else {
				parteRel.setEnabled(false);
				parteRel.setValue("");
			}
		},

		onDtVigenciaDeChange: function (oEvent) {
			var dMindate = oEvent.getSource().getDateValue();
			this.byId("inpDtVigenciaAte").setValue("");
			this.byId("inpDtVigenciaAte").setMinDate(dMindate);
		},

		getDialogParteRel: function (sFragment) {
			if (!this._oDialogParteRelacionada) {
				this._oDialogParteRelacionada = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogParteRelacionada);
			}

			return this._oDialogParteRelacionada;
		},

		_onOpenDialogParteRel: function (oEvent) {
			var that = this,
				oModel = this.getModel(),
				oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				sEntity = "/ParteRelacionadaItemSet",
				sDialog = "com.sap.build.sapcsr.SOLCONT.view.fragments.ParteRelacionada";

			oOwnerComponent.showBusyIndicator();
			this.oDialogParteRelacionada = this.getDialogParteRel(sDialog);

			oModel.read(sEntity, {
				success: function (oData) {
					var oParteRelModel = new JSONModel(oData);
					oView.setModel(oParteRelModel, "parteRelacModel");
					oOwnerComponent.hideBusyIndicator();
					that.oDialogParteRelacionada.open();
					that.handleNav();
				}.bind(that),
				error: function (oError) {
					oOwnerComponent.hideBusyIndicator();
				}
			});

		},
		onDialogParteRelClose: function (oEvent) {
			this._oDialogParteRelacionada.close();
		},

		onSearchParteRel: function (oEvent) {
			var that = this,
				oModel = this.getModel(),
				oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				sValue = oEvent ? oEvent.getParameter("query") : "";

			var aFilter = new Filter({
				filters: [
					new Filter("SearchStr", sap.ui.model.FilterOperator.Contains, sValue)
				]
			});

			oModel.read("/ParteRelacionadaItemSet",
				 {
				 	filters: [aFilter],
					success: function (oData) {
						var oParteRelModel = new JSONModel(oData);
						oView.setModel(oParteRelModel, "parteRelacModel");
						oOwnerComponent.hideBusyIndicator();

					}.bind(that),
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
					}
				});

		},

		onParteRelItemPress: function (oEvent) {
			var oSelItem = oEvent.getParameter("listItem").getBindingContextPath();

			var oSelParteRel = this.getModel("parteRelacModel").getObject(oSelItem);

			var oSelectedParteRel = new JSONModel(oSelParteRel);
			this.getView().setModel(oSelectedParteRel, "SelectedParteRel");
			this.getView().getModel("SelectedParteRel").refresh();

			this.getView().byId("inpParteRelac").setValue("");
			this.getView().byId("inpParteRelac").setValue(oSelParteRel.RazaoSoc);
			//this.getView().byId("inpCNPJ").setValue(oSelParteRel.Cnpj);
			//this.getView().byId("inpRazao").setValue(oSelParteRel.RazaoSoc);
			this._oDialogParteRelacionada.close();
		},

		validateParteRelFields: function (oParams, oIdInput) {
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

		onNewParteRel: function (oEvent) {
			var oModel = this.getModel(),
				structureAppModel = this.getModel("structureApp"),
				oParteRel = structureAppModel.getProperty("/parteRel");
			var sCnpj = sap.ui.getCore().byId("inpNewCnpjParteRel").getValue();

			var oParams = {

				Id: oParteRel.Id,
				Cnpj: this.retirarFormatacao(sCnpj),
				RazaoSoc: oParteRel.RazaoSoc
			};

			var isValid = this.validateParteRelFields(oParams, "inpNewRazaoSocParteRel");
			isValid = this.validateParteRelFields(oParams, "inpNewCnpjParteRel");

			if (isValid) {
				this.SaveParteRelacionada(oParams, oModel);
			} else {
				MessageToast.show(this.geti18nText("campo_obrigatorio_msg"));
			}
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
					that.onSearchParteRel();
					sap.ui.getCore().byId("inpNewRazaoSocParteRel").setValue("");
					sap.ui.getCore().byId("inpNewCnpjParteRel").setValue("");
					that.handleNav();
				},
				error: function (oError) {
					that.getOwnerComponent()._genericErrorMessage(that.geti18nText("insere_parte_rel_erro"));
					oModel.refresh(true);
				}
			});

		},
		
		handleNav: function(evt) {
			var navCon = sap.ui.getCore().byId("navCon");
			var target = evt ? evt.getSource().data("target") : null;
			if (target) {
				var animation = "slide";
				navCon.to(sap.ui.getCore().byId(target), animation);
			} else {
				navCon.back();
			}
		},
		
		
		getDialogTpDoc: function (sFragment) {
			if (!this._oDialogTpDoc) {
				this._oDialogTpDoc = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogTpDoc);
			}

			return this._oDialogTpDoc;
		},
		
		openDialogTipoDoc: function(oEvent){
			var that = this,
				oDataM = this.getModel(),
				oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				sEntity = "/SearchHelpSet",
				sDialog = "com.sap.build.sapcsr.SOLCONT.view.fragments.TipoDoc";

			oOwnerComponent.showBusyIndicator();
			this.oDialogTpDoc = this.getDialogTpDoc(sDialog);
		
			oDataM.read(sEntity, {
				filters: [new Filter("IpDominio", sap.ui.model.FilterOperator.EQ, "ZMMD_SOLCONT_TPDOCUMENTO")],
				urlParameters: {
					"$expand": "SearchHelpItemSet"
				},
				success: function (oData) {
					var aNodes = {
						nodes: []
					};

					for (var i = 0; i < oData.results.length; i++) {
						var oItem = oData.results[i];
						var oNode = {
							IpDominio: oItem.IpDominio,
							Id: oItem.Id,
							Descricao: oItem.Descricao,
							Grupo: oItem.Grupo,
							nodes: []
						};
						for (var x = 0; x < oData.results[i].SearchHelpItemSet.results.length; x++) {
							var value = oData.results[i].SearchHelpItemSet.results[x];

							var oSubNode = {
								IpDominio: value.IpDominio,
								Id: value.Id,
								Descricao: value.Descricao,
								Grupo: value.Grupo
							};
							oNode.nodes.push(oSubNode);
						}
						aNodes.nodes.push(oNode);
					}
					var oJsModel = new JSONModel(aNodes);
					that.getView().setModel(oJsModel, "shTreeModel");
					that.oDialogTpDoc.open();
					oOwnerComponent.hideBusyIndicator();
				}.bind(that),
				error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
					}
			});
			
		},
		
		onDialogTpDocClose: function(oEvent){
			this._oDialogTpDoc.close();
		},
		
		onTreeItemTpDocPress: function(oEvent){
			var oSource = oEvent.getSource(),
				oContext = oSource.getSelectedContexts()[0],
				oSelItem = this.getModel("shTreeModel").getObject(oContext.getPath());
				
			var oSelectedTpDoc = new JSONModel(oSelItem);
			this.getView().setModel(oSelectedTpDoc, "SelectedTpDoc");
			this.getView().getModel("SelectedTpDoc").refresh();
			
			this.byId("inpTpDoc").setValue("");	
			this.byId("inpTpDoc").setValue(oSelItem.Descricao);
			this._oDialogTpDoc.close();
		},

		/********************************************
		 *   DIALOG PARA SELEÇÃO DE Aprovador
		 **********************************************/

		getDialogAprovador: function (sFragment) {
			if (!this._oDialogAprovador) {
				this._oDialogAprovador = sap.ui.xmlfragment(sFragment, this);
				this.getView().addDependent(this._oDialogAprovador);
			}

			return this._oDialogAprovador;
		},

		_onOpenDialogAprovador: function () {
			var oView = this.getView();
			var oOwnerComponent = this.getOwnerComponent();
			var oController = this;
			this.oDialogAprovadores = this.getDialogAprovador("com.sap.build.sapcsr.SOLCONT.view.fragments.Aprovadores");
			oOwnerComponent.showBusyIndicator();
			if (!oView.getModel("aprovador")) {
				oOwnerComponent.showBusyIndicator();
				$.ajax({
					url: "/sap/opu/odata/SAP/ZMM_SOLCONT_SRV_01/GestoresSet?$format=json",
					success: function (oResponse) {
						oController.oAprovadores = oResponse.d;
						var oModel = new JSONModel(oController.oAprovadores);
						oView.setModel(oModel, "aprovadores");
						oOwnerComponent.hideBusyIndicator();
						oController.oDialogAprovadores.open();
					},
					error: function (oResponse) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(oController.geti18nText("aprovadores_load_erro_msg"));
					},
					type: 'GET'
				});
			} else {
				this.oDialogAprovadores.open();
			}

		},

		_onDialogAprClose: function () {
			this.oDialogAprovadores.close();
		},

		_onTableItemAprPress: function (oEvent) {
			var oController = this;
			var oCampoApr = oController.getView().byId("inpSegundoA");
			var aContexts = oEvent.getParameter("selectedContexts");
			var beneficiarioId = aContexts.map(function (oContext) {
				return oContext.getObject();
			});
			var aprovador = oController.formatter.textName(beneficiarioId[0].Nome),
				sMatriculaAprovador = oController.formatter.textName(beneficiarioId[0].Matricula);
			oCampoApr.setValue(aprovador);

			var oSelectedAprovador = new JSONModel(beneficiarioId[0]);
			this.getView().setModel(oSelectedAprovador, "selectedAprovador");

			this.setCentroDeCustoAprovador(sMatriculaAprovador);

		},

		_onSearchApr: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"Nome",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		setCentroDeCustoAprovador: function (sMatricula) {
			var oView = this.getView(),
				oOwnerComponent = this.getOwnerComponent(),
				oModel = this.getModel(),
				that = this;

			if (sMatricula) {
				oOwnerComponent.showBusyIndicator();

				oModel.read(oModel.createKey("/CentroCustoUsuarioSet", {
					Matricula: sMatricula
				}), {
					success: function (oData) {

						var oCCustoAprov = new JSONModel(oData);
						oView.setModel(oCCustoAprov, "centroCusotAprovModel");
						oView.byId("inpCentroC").setValue(oCCustoAprov.getProperty("/CentroCusto"));
						oView.byId("inpGerencia").setValue(oCCustoAprov.getProperty("/DescCentroCusto"));
						oOwnerComponent.hideBusyIndicator();

					},
					error: function (oError) {
						oOwnerComponent.hideBusyIndicator();
						oOwnerComponent._genericErrorMessage(that.geti18nText("centro_custo_error_load_msg"));
					}

				});
			}

		}

	});
});