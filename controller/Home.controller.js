sap.ui.define([
	'./BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device'
], function (BaseController, JSONModel, Device ) {
	"use strict";
	return BaseController.extend("com.sap.build.sapcsr.SOLCONT.controller.Home", {


		onInit: function () {
			var oViewModel = new JSONModel({
				isPhone : Device.system.phone
			});
			this.setModel(oViewModel, "view");
			Device.media.attachHandler(function (oDevice) {
				this.getModel("view").setProperty("/isPhone", oDevice.name === "Phone");
			}.bind(this));
		}
	});
});