sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/models",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/model/resource/ResourceModel"
], function (UIComponent, models, MessageBox, History) {
	"use strict";
	return UIComponent.extend("com.sap.build.sapcsr.SOLCONT.Component", {
		metadata: {
			manifest: "json"
		},
		init: function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.setModel(models.createStructureAppModel(), "structureApp");

			// create the views based on the url/hash
			this.getRouter().initialize();
			
			this.oListSolic = undefined; 
		},

		myNavBack: function () {
			var oHistory = History.getInstance();
			var oPrevHash = oHistory.getPreviousHash();
			if (oPrevHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("masterSettings", {}, true);
			}
		},

		getContentDensityClass: function () {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		showBusyIndicator: function (iDuration, iDelay, callback, oController) {
			sap.ui.core.BusyIndicator.show(iDelay);

			if (iDuration && iDuration > 0) {
				if (this._sTimeoutId) {
					jQuery.sap.clearDelayedCall(this._sTimeoutId);
					this._sTimeoutId = null;
				}

				this._sTimeoutId = jQuery.sap.delayedCall(iDuration, this, function () {
					this.hideBusyIndicator(callback, oController);
				});
			}
		},

		hideBusyIndicator: function (callback, oController) {
			sap.ui.core.BusyIndicator.hide();
			if (!callback === 0)
				callback(this);
		},
		_genericErrorMessage: function (sMsg) {
			MessageBox.error(
				sMsg, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Atenção",
					styleClass: "sapUiSizeCompact"
				}
			);
		},

		_genericSuccessMessage: function (sMsg) {
			MessageBox.success(
				sMsg, {
					icon: sap.m.MessageBox.Icon.SUCCESS,
					title: "Sucesso",
					styleClass: "sapUiSizeCompact"
				}
			);
		}

	});
});