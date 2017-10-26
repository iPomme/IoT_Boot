/**************************************
* SETUP Wifi
**/
let SSID = "conductr";
let WIFI_PWD = "conductrpi";
let wifi = require("Wifi");
let hostname = getSerial()+"-espruino";

/**************************************
* SETUP MQTT
**/
let server = "192.168.0.2"; // the ip of your MQTT broker
let topicEvt = "DRONE/"+hostname+"/evt";
let topicWill = "DRONE/"+hostname+"/status";
var mqttConnected = false;

function connectMQTT(c) {
  if(typeof c != "undefined" && !c.connected){
     console.log("Try to connect MQTT\n");
    try{
     c.connect();
    }catch(e){
      console.log("[MQTT] connection error:"+e);
    }
   }else{
     console.log("[watch] MQTT connected");
   }
}
function initMQTT() {
    var Client = require('micro-mqtt').Client;
    var client = new Client({
        host: server,
        clientId: hostname,
        will: {
            topic: topicWill,
            message: JSON.stringify({ status: 'dead' }),
            qos: 0,
            retain: true
        }
    });
    client.on('connected', function () {
        mqttConnected = true;
        client.publish(topicWill, JSON.stringify({ status: 'alive' }), 0, true);
    });
    client.on("disconnected", () => {
	    console.log("[MQTT] disconnected");
        mqttConnected = false;
	    connectMQTT(mqtt);
    });
    client.on('debug', function (debug) {
        console.log('[MQTT] debug: ' + debug);
    });
    client.on('info', function (info) {
        console.log('[MQTT] info: ' + info);
    });
    client.on('error', function (error) {
        console.log('[MQTT] error: ' + error);
    });
    global.mqtt = client;
}


var mpu;
var dmp;

function onInit() {
  console.log('On init ...');
  I2C1.setup({scl:D17, sda:D16, bitrate:100000});
  mpu = require("MPU6050").connect(I2C1);
  // 2nd parameter is the fifoRate. The DMP output frequency = 200Hz / (1 + fifoRate)
  dmp = require("MPU6050_DMP").create(mpu, 50);
  wifi.connect(SSID, {password: WIFI_PWD}, err => {
    console.log("connected? err=", err, "info=", wifi.getIP());
    initMQTT();
    connectMQTT(mqtt);
    //eval('delete onInit');
  });
}

var msgID = 0;
function publishData() {
  let data = dmp.getData();
  if(data !== undefined){
    let d = '{"c": ' + msgID++ + ', "qw": ' + data.qw + ', "qx": ' + data.qx + ', "qz": ' + data.qz + ', "qy": ' + data.qy + '}';
    console.log(d);
    if(mqttConnected) {
      mqtt.publish(topicEvt, d);
      //mqtt.publish(topicEvt,JSON.stringify(data));
      console.log("Published !");
    }
  }
}

var timerID;
function startReading(delta){
  clearInterval();
  timerID = setInterval(publishData,delta);
}
function stop(){
   clearInterval(timerID);
}

//setWatch(pidLoop, D15, { repeat:true, edge:'rising' });
