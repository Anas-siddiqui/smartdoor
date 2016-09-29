var webSocketUrl = "wss://api.artik.cloud/v1.1/websocket?ack=true";
var device_id = "";
var device_token = "";


var WebSocket = require('ws');
var isWebSocketReady = false;
var data="";
var ws = null;


var gpio = require('rpi-gpio');
var myPin = 12;// physical pin #
var buzzerState = 0;
var timeout=2000;



/**
 * Gets the current time in millis
 */
function getTimeMillis(){
    return parseInt(Date.now().toString());
}

/**
 * Create a /websocket connection and setup GPIO pin
 */
function start() {
    //Create the WebSocket connection
    isWebSocketReady = false;
    ws = new WebSocket(webSocketUrl);
    ws.on('open', function() {
        console.log("WebSocket connection is open ....");
        register();
    });
    ws.on('message', function(data) {
 //      console.log("Received message: " + data + '\n');
         handleRcvMsg(data);
        
    });
    ws.on('close', function() {
        console.log("WebSocket connection is closed ....");
        exitClosePins();
    });
     gpio.setup(myPin, gpio.DIR_OUT, function(err) {
        if (err) throw err;
        buzzerState = false; // default to false after setting up
        console.log('Setting pin ' + myPin + ' to out succeeded! \n');
     });

   
        
        
    
}

/**
 * Sends a register message to /websocket endpoint
 */
function register(){
    console.log("Registering device on the WebSocket connection");
    try{
        var registerMessage = '{"type":"register", "sdid":"'+device_id+'", "Authorization":"bearer '+device_token+'", "cid":"'+getTimeMillis()+'"}';
        console.log('Sending register message ' + registerMessage + '\n');
        ws.send(registerMessage, {mask: true});
        isWebSocketReady = true;
    }
    catch (e) {
        console.error('Failed to register messages. Error in registering message: ' + e.toString());
    }    
}


/**
 * Handle Actions
   Example of the received message with Action type:
   {
   "type":"action","cts":1451436813630,"ts":1451436813631,
   "mid":"37e1d61b61b74a3ba962726cb3ef62f1",
   "sdid”:”xxxx”,
   "ddid”:”xxxx”,
   "data":{"actions":[{"name":"setOn","parameters":{}}]},
   "ddtid":"dtf3cdb9880d2e418f915fb9252e267051","uid":"650xxxx”,”mv":1
   }
 */
function handleRcvMsg(msg){
    var msgObj = JSON.parse(msg);
    if (msgObj.type != "action") return; //Early return;

    var actions = msgObj.data.actions;
    var actionName = actions[0].name; //assume that there is only one action in actions
    console.log("The received action is " + actionName);
    var newState;
    if (actionName.toLowerCase() == "set_open") {
        togglebuzzer(1);
        setTimeout(togglebuzzer(0), 2000); //stop buzzing after 2 sec
    
    }
    else if (actionName.toLowerCase() == "set_close") {
       //do something when received close
    
    }
    
  
     else {
        console.log('Do nothing since receiving unrecognized action ' + actionName);
        return;
    }
    
}

function togglebuzzer(value) {
    gpio.write(myPin, value, function(err) {
        if (err) throw err;
        buzzerState = value;
        
    });

}

/**
 * Send one message to ARTIK Cloud
 */
function sendStateToArtikCloud(value){
    try{
        ts = ', "ts": '+getTimeMillis();
        var data = {
            "visitors": value
            
            
                           
            };
        var payload = '{"sdid":"'+device_id+'"'+ts+', "data": '+JSON.stringify(data)+', "cid":"'+getTimeMillis()+'"}';
        console.log('Sending payload ' + payload + '\n');
        ws.send(payload, {mask: true});
    } catch (e) {
        console.error('Error in sending a message: ' + e.toString() +'\n');
    }    
}

/** 
 * Properly cleanup the pins
 */

function exitClosePins() {
    gpio.destroy(function() {
        console.log('Exit and destroy all pins!');
        process.exit();
    });
}
function loop(){ //run python code to detect people
  var spawn = require('child_process').spawn,
    py    = spawn('python', ['/home/pi/smartdoor/code.py']),
    
    dataString = '';

py.stdout.on('data', function(data){
  dataString += data.toString();
});
py.stdout.on('end', function(){
    dataString=dataString.replace(/\s/g, '');
  console.log(dataString);
  sendStateToArtikCloud(dataString);
});
}
/**
 * All start here
 */

start();

setInterval(loop, timeout);//delay of 2sec is set in timeout

