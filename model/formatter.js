sap.ui.define([
	"sap/base/strings/formatMessage",
	"sap/ui/core/format/DateFormat"
], function (formatMessage, DateFormat) {
	"use strict";

	return {
		formatMessage: formatMessage,

		/**
		 * @public
		 * @param {boolean} bIsPhone the value to be checked
		 * @returns {string} path to image
		 */
		srcImageValue : function (bIsPhone) {
			var sImageSrc = "";
			if (bIsPhone === false) {
				sImageSrc = "./images/homeImage.jpg";
			} else {
				sImageSrc = "./images/homeImage_small.jpg";
			}
			return sImageSrc;
		},
		
		getIcon: function(svalue){
			var icon;
			if(svalue === "Aprovado"){
				 icon="sap-icon://accept";
			}
			else if(svalue === "Pendente"){
				 icon="sap-icon://pending";
			}
			else if(svalue === "Cancelado"){
				 icon="sys-cancel";
			}
			return icon;
		},
		
		getColor: function(svalue){
			var color;
			if(svalue === "Aprovado"){
				 color="#36CC2C";
			}
			else if(svalue === "Pendente"){
				 color="#FFC300";
			}
			else if(svalue === "Cancelado"){
				 color="#FF5733";
			}
			return color;
		},
		
		solicNumber: function (numSolic) {
			
			if(numSolic){
				return parseInt(numSolic);
			}
			else{
				return	numSolic;
			}
		},
		
		date :  function (oDate) {
			if (oDate === null) return "";
			var oDateFormat = DateFormat.getDateTimeInstance({
				pattern : "dd/MM/yyyy"
			});
			return oDateFormat.format(new Date(oDate),true);
		},
		
		formatDateShow: function(oDate) {
			var oDateInstance = DateFormat.getDateInstance({
				pattern: "dd/MM/yyyy"
			});
			return oDate && oDateInstance.format(new Date(oDate),true);
		},
		
		textName: function(text){
			if (text !== null && text !== undefined) {
				var splitText = text.toLowerCase().split(" ");
				for (var i = 0; i < splitText.length; i++) {

					splitText[i] = splitText[i].charAt(0).toUpperCase() + splitText[i].substring(1);
				}
				return splitText.join(" ");
			}
		},
		
		mascaraCnpj: function (valor) {
    		return valor && valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,"\$1.\$2.\$3\/\$4\-\$5");
		}
		
	};
});