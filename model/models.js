sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel : function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createStructureAppModel: function(){
			return new JSONModel({
				solViewModel:{
					enabled: true,
					fowardEnabled: false
				},
				userData: {
					IdUser: "",
					Nome: "",
					Perfil: "",
					CentroCusto: "",
					Gerrencia: "",
					Telefone: ""
				},
				procuradorData:{
					Matricula: "",
					Nome: "",
					NumSolic:"",
					RazaoSoc: ""
				}
			});
		}
	};

});