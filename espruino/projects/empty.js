/**************************************
* SETUP Wifi
**/
let SSID = "conductr";
let WIFI_PWD = "conductrpi";
let wifi = require("Wifi");
let hostname = getSerial()+"-espruino";

function onInit() {
  console.log('On init ...');
    wifi.connect(SSID, {password: WIFI_PWD}, err => {
    console.log("connected? err=", err, "info=", wifi.getIP());
    eval('delete onInit');
  });
}

