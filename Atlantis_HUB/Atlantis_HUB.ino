#include <Wire.h>
#include <LiquidCrystal_I2C.h>  //display 
#include <WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include "time.h"
#include <Preferences.h>

//WIFI types definition
WiFiClient wifiClient;
WiFiServer server(80);

//WIFI AP setup
String header;
short resetPin = 19;                                  //if true then isServerMode wil be set to true. Device will start as AP
StaticJsonDocument<400> json_data_http;               //store JSON from config page (AP Html page)
const char* APssid     = "Atlantis-Hub-Access-Point";
const char* APpassword = "";                          //OpenNetwork
Preferences preferences;                              //Configs from memory
boolean isServerMode = true;                          //Define the mode for esp accesspoint\client
IPAddress IP;                                         //IP for AP
String accessPointAddress;                            //String type of IP variable

//Wifi client settings
String ssid;               //variable to store ssid during work
String password;           //variable to store password during work
String localAddress;       //variable to store ip address after connection

//Time settings to get the time from www
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 7200;
const int   daylightOffset_sec = 3600;
char timeStringBuff[30];
char dateStringBuff[30];
char datetimeStringBuff[30];

//MQTT settings
PubSubClient client(wifiClient);               //MQTT client variable for connection
long lastMsg = 0;
int value = 0;
char buffer[500];                              //Buffer for storing json
const size_t CAPACITY = JSON_OBJECT_SIZE(7);   //Json object with capacity (key value count)
StaticJsonDocument<CAPACITY> doc;              //JSON doc for sending data
boolean isAtlantisOK = true;                   //system status. received from web service
String alarmMessage = "";                      //system alarm msg. received from web service
String mqttaddress;                            //config block for user settings
String mqttdevicename;
String mqttlogin;
String mqttpassword;
String mqttpubname = "atlantis/hub";
String mqttsubname = "atlantis/hubnotify";

LiquidCrystal_I2C lcd(0x27, 16, 2);            //display initialize

const int BUZZER_PIN = 18;                     // GIOP18 pin connected to piezo buzzer


void setup() {
  Serial.begin(115200);

  preferences.begin("app_configs", false);

  pinMode(resetPin, INPUT);

  if (digitalRead(resetPin) == HIGH) {
    Serial.print("========RESET DEVICE CALLED========");
    preferences.putBool("isServerMode", true);
  } else {
    Serial.print("========WORK AS CLIENT========");
    preferences.putBool("isServerMode", false);
  }

  ssid = preferences.getString("ssid", "Nothing");
  password = preferences.getString("password", "Nothing");
  mqttaddress = preferences.getString("mqttaddress", mqttaddress);
  mqttdevicename = preferences.getString("mqttdevicename", mqttdevicename);
  mqttlogin = preferences.getString("mqttlogin", mqttlogin);
  mqttpassword = preferences.getString("mqttpassword", mqttpassword);

  //  Serial.print("CONFIG SSID=");
  //  Serial.println(ssid);
  //  Serial.print("CONFIG PASS=");
  //  Serial.println(password);
  //  Serial.print("CONFIG mqttaddress=");
  //  Serial.println(mqttaddress);
  //  Serial.print("CONFIG mqttdevicename=");
  //  Serial.println(mqttdevicename);
  //  Serial.print("CONFIG mqttlogin=");
  //  Serial.println(mqttlogin);
  //  Serial.print("CONFIG mqttpassword=");
  //  Serial.println(mqttpassword);
    isServerMode = preferences.getBool("isServerMode", true);
  //  Serial.print("CONFIG IS SERVER MODE=");
  //  Serial.println(isServerMode);

  lcd.init();                              //lcd init
  lcd.backlight();                         //turnon background light for lcd

  if (isServerMode) {
    WiFi.mode(WIFI_MODE_AP);

    //setup ap to config connection
    Serial.print("Setting AP (Access Point)…");
    WiFi.softAP(APssid, APpassword);
    IPAddress IP = WiFi.softAPIP();
    accessPointAddress = IpAddress2String(IP);
    //    Serial.print("AP IP address: ");
    //    Serial.println(IP);
    //    Serial.print("AP IP String address: ");
    //    Serial.println(accessPointAddress);

    server.begin();

    lcd.setCursor(4, 0);
    lcd.print(F("  AP MODE. IP:"));
    lcd.setCursor(1, 1);
    lcd.print(accessPointAddress);
  } else {
    WiFi.mode(WIFI_MODE_STA);

    Serial.println("Starting.......");
    connectToWifi();

    //Setup MQTT
    Serial.println("Connecting to mqtt server......");
    client.setServer(mqttaddress.c_str(), 1883);           //default port is 1883
    client.setBufferSize(460);
    client.subscribe(mqttsubname.c_str());
    client.setCallback(callback);
    Serial.println("......Setup done......");
  }
}


void loop() {
  if (isServerMode) {
    showConfigPage();
    return;
  }

  Serial.print("---MQTT TOPIC---");
  Serial.println(mqttpubname);

  //SCREEN BLOCK 1
  lcd.setCursor(2, 0);
  lcd.print(F("Wifi: "));
  if (WiFi.status() != WL_CONNECTED) {
    lcd.setCursor(9, 0);
    lcd.print(F("Offline"));
    connectToWifi();
  } else {
    lcd.setCursor(9, 0);
    lcd.print(F("Online"));
  }

  //SCREEN BLOCK 2
  lcd.setCursor(2, 1);
  lcd.print(F("MQTT: "));
  if (!client.connected()) {
    lcd.setCursor(9, 1);
    lcd.print(F("Offline"));
    reconnect();
  } else {
    lcd.setCursor(9, 1);
    lcd.print(F("Online"));
  }
  client.loop();

  delay(2000);
  lcd.clear();

  //SCREEN BLOCK 3
  lcd.setCursor(4, 0);
  lcd.print(F("Wifi IP:"));
  lcd.setCursor(2, 1);
  lcd.print(WiFi.localIP());

  delay(2000);
  lcd.clear();

  //Update time state
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  printLocalTime();

  Serial.println("----TIME----");
  Serial.println(datetimeStringBuff);

  //SCREEN BLOCK 4
  //  Serial.print("dateStringBuff msg=");
  //  Serial.println(dateStringBuff);
  lcd.setCursor(3, 0);
  lcd.print(dateStringBuff);
  //  Serial.print("timeStringBuff msg=");
  //  Serial.println(timeStringBuff);
  lcd.setCursor(4, 1);
  lcd.print(timeStringBuff);

  delay(2000);
  lcd.clear();

  //SCREEN BLOCK 5
  lcd.setCursor(2, 0);
  lcd.print(F("System status"));
  if (isAtlantisOK) {
    lcd.setCursor(7, 1);
    lcd.print(F("OK"));
  } else {
    lcd.setCursor(5, 1);
    lcd.print(F("NOT OK"));
  }

  delay(2000);
  lcd.clear();

  //SCREEN BLOCK 6
  //  Serial.print("Alarm msg=");
  //  Serial.println(alarmMessage);
  //  Serial.print("isAtlantisOK=");
  //  Serial.println(isAtlantisOK);
  if (!alarmMessage.equals("") && !isAtlantisOK) {
    updateUI(alarmMessage);
  }

  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;

    // create an object
    JsonObject object = doc.to<JsonObject>();
    object["dTime"] = datetimeStringBuff;
    object["ssid"] = ssid;
    object["IP"] = localAddress;
    object["health"] = "ok";                    //by default if web client get this value we assume that hub online

    // Convert the value to a char array
    size_t n = serializeJson(doc, buffer);
    //    Serial.print("object: ");
    //    Serial.println(buffer);
    //    Serial.print("size: ");
    //    Serial.println(n);
    client.publish(mqttpubname.c_str(), buffer);
  }
}

void printLocalTime()
{
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  strftime(datetimeStringBuff, sizeof(datetimeStringBuff), "%F %H:%M:%S", &timeinfo);
  strftime(dateStringBuff, sizeof(dateStringBuff), "%F", &timeinfo);
  strftime(timeStringBuff, sizeof(timeStringBuff), "%H:%M:%S", &timeinfo);
}

void connectToWifi() {
  Serial.println("Connecting to Wifi");
  WiFi.begin(ssid.c_str(), password.c_str());
  //WiFi.setSleep(false);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  localAddress = IpAddress2String(WiFi.localIP());
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect

    if (client.connect(mqttdevicename.c_str(), mqttlogin.c_str(), mqttpassword.c_str())) {
      Serial.println("connected");
      // Subscribe
      client.subscribe(mqttsubname.c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String receivedMessage;

  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    receivedMessage += (char)message[i];
  }
  Serial.println();

  if (receivedMessage.equals("OK")) {
    alarmMessage = "";
    isAtlantisOK = true;
  } else if (receivedMessage.equals("restart")) {
    ESP.restart();
  } else {
    alarmMessage = receivedMessage;
    isAtlantisOK = false;
    updateUI(alarmMessage);
  }
}

void updateUI(String message) {
  //    Serial.println("Alarm UI update");
  //    Serial.print("msg=");
  //    Serial.println(message);

  lcd.clear();
  lcd.setCursor(1, 0);
  lcd.print(F("ALARM! Check:"));

  lcd.setCursor(0, 1);
  lcd.print(message);

  alarmSong();
  delay(2000);
  lcd.clear();
}

void alarmSong() {
  Serial.println("ringing");
  ledcAttachPin(BUZZER_PIN, 0);
  ledcWriteNote(0, NOTE_C, 4);
  delay(500);
  ledcWriteNote(0, NOTE_D, 4);
  delay(500);
  ledcWriteNote(0, NOTE_E, 4);
  delay(500);
  ledcWriteNote(0, NOTE_F, 4);
  delay(500);
  ledcWriteNote(0, NOTE_G, 4);
  delay(500);
  ledcWriteNote(0, NOTE_A, 4);
  delay(500);
  ledcWriteNote(0, NOTE_B, 4);
  delay(500);
  ledcDetachPin(BUZZER_PIN);
}

String IpAddress2String(const IPAddress& ipAddress) {
  return String(ipAddress[0]) + String(".") + \
         String(ipAddress[1]) + String(".") + \
         String(ipAddress[2]) + String(".") + \
         String(ipAddress[3]) ;
}

void showConfigPage() {
  WiFiClient client = server.available();         // Listen for incoming clients

  if (client) {                                   // If a new client connects,
    //    Serial.println("New Client.");          // print a message out in the serial port
    String currentLine = "";                      // make a String to hold incoming data from the client
    while (client.connected()) {                  // loop while the client's connected
      if (client.available()) {                   // if there's bytes to read from the client,
        char c = client.read();                   // read a byte, then
        Serial.write(c);                          // print it out the serial monitor
        if (c == '\n') {                    // if the byte is a newline character
          // if the current line is blank, you got two newline characters in a row.
          // that's the end of the client HTTP request, so send a response:
          if (currentLine.length() == 0) {
            // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
            // and a content-type so the client knows what's coming, then a blank line:
            client.println("HTTP/1.1 200 OK");
            //client.println("Content-Type: text/html");
            client.println("Access-Control-Allow-Origin: *");
            //client.println("Connection: close");
            client.println();
            // client.print("This will be the first thing to appear on the browser.");

            String body_data = "";
            while (client.available()) {
              char c = (char)client.read();
              body_data += c;
              Serial.print(c);
            }
            Serial.println();

            if (body_data.length() > 0) {
              Serial.print("Body Data: ");
              Serial.println(body_data);
              deserializeJson(json_data_http, body_data);

              Serial.print("request ssid: ");
              String dssid = json_data_http["ssid"];
              Serial.println(dssid);

              Serial.print("request pass: ");
              String dpass = json_data_http["password"];
              Serial.println(dpass);

              Serial.print("request mqttaddress: ");
              String mqttaddress = json_data_http["mqttaddress"];
              Serial.println(mqttaddress);

              Serial.print("request mqttdevicename: ");
              String mqttdevicename = json_data_http["mqttdevicename"];
              Serial.println(mqttdevicename);

              Serial.print("request mqttlogin: ");
              String mqttlogin = json_data_http["mqttlogin"];
              Serial.println(mqttlogin);

              Serial.print("request mqttpassword: ");
              String mqttpassword = json_data_http["mqttpassword"];
              Serial.println(mqttpassword);

              preferences.putString("ssid", dssid);
              preferences.putString("password", dpass);
              preferences.putString("mqttaddress", mqttaddress);
              preferences.putString("mqttdevicename", mqttdevicename);
              preferences.putString("mqttlogin", mqttlogin);
              preferences.putString("mqttpassword", mqttpassword);
              preferences.putBool("isServerMode", false);
            }


            // Display the HTML web page
            client.println("<!DOCTYPE html><html>");
            client.println("<html lang=\"en\">");
            client.println("<head>");
            client.println("<meta charset=\"UTF-8\">");
            client.println("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
            client.println("<title>AtlantisHUB Config Web Server</title>");
            client.println("<style>");
            client.println("body{ margin: 0;padding: 0;font-family: Arial, Helvetica, sans-serif;background-color: #2c257a;}");
            client.println(".box{ width: 70%; padding: 40px; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background-color: #191919; color: white; text-align: center; border-radius: 24px; box-shadow: 0px 1px 32px 0px rgba(0,227,197,0.59);}");
            client.println("h1{ text-transform: uppercase; font-weight: 500;}");
            client.println("input{ border: 0; display: block; background: none; margin: 20px auto; text-align: center; border: 2px solid #4834d4; padding: 14px 10px; width: 45%; outline: none; border-radius: 24px; color: white; font-size: smaller; transition: 0.3s;}");
            client.println("input:focus{ width: 90%; border-color:#22a6b3 ;}");
            client.println("input[type='submit']{ border: 0; display: block; background: none; margin: 20px auto; text-align: center; border: 2px solid #22a6b3; padding: 14px 10px; width: 140px; outline: none; border-radius: 24px; color: white; transition: 0.3s; cursor: pointer;}");
            client.println("input[type='submit']:hover{ background-color: #22a6b3;}");
            client.println("</style>");
            client.println("</head>");
            client.println("<body>");

            client.println("<form action=\"/get\" class=\"box\" id=\"myForm\">");
            client.println("<h1>AtlantisHUB Config Web Server</h1>");
            client.println("<h3>Network configurations</h3>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"username\" type=\"text\" id=\"ssid\" placeholder=\"WiFi name (SSID)\">");
            client.println("</div>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"password\" type=\"password\" id=\"password\" placeholder=\"WiFI password\">");
            client.println("</div>");
            client.println("<h3>MQTT server configurations</h3>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttaddress\" type=\"text\" id=\"mqttaddress\"  placeholder=\"MQTT server address\">");
            client.println("</div>");
            client.println("<h5>Port hardcoded: 1883</h5>");
            client.println("<h5>Time fetched based on server pool.ntp.org ( GMT offset = 7200, day light offset = 3600)</h5>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttdevicename\" type=\"text\" id=\"mqttdevicename\" placeholder=\"MQTT device name\">");
            client.println("</div>");
            client.println("<h5>Should be uniq for all devices in the system</h5>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttlogin\" type=\"text\" id=\"mqttlogin\" placeholder=\"MQTT login\">");
            client.println("</div>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttpassword\" type=\"password\" id=\"mqttpassword\" placeholder=\"MQTT password\">");
            client.println("</div>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttdevicepublishtag\" type=\"text\" id=\"mqttdevicepublishtag\" value=\""+mqttpubname+"\" disabled>");
            client.println("</div>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttdevicesubscribetag\" type=\"text\" id=\"mqttdevicesubscribetag\" value=\""+mqttsubname+"\" disabled>");
            client.println("</div>");
            client.println("<input type=\"submit\" value=\"Save\">");
            client.println("</form>");

            client.println("</body>");
            client.println("<script> window.addEventListener(\"load\", () => { function sendData() { const XHR = new XMLHttpRequest();");
            client.println("// Bind the FormData object and the form element");
            client.println("const FD = new FormData(form); // Define what happens on successful data submission");
            client.println("XHR.addEventListener(\"load\", (event) => { alert(\"All Ok. Restart Atlantis hub.\"); });  // Define what happens in case of error");
            client.println("XHR.addEventListener(\"error\", (event) => { alert(\'Oops! Something went wrong.\'); }); // Set up our request");
            client.println("XHR.open(\"POST\", \"http://" + accessPointAddress + "\"); ");
            client.println("var data = { \"ssid\": document.getElementById(\"ssid\").value,");
            client.println("\"password\":document.getElementById(\"password\").value,");
            client.println("\"mqttaddress\":document.getElementById(\"mqttaddress\").value,");
            client.println("\"mqttdevicename\":document.getElementById(\"mqttdevicename\").value,");
            client.println("\"mqttlogin\":document.getElementById(\"mqttlogin\").value,");
            client.println("\"mqttpassword\":document.getElementById(\"mqttpassword\").value,");
            client.println("\"password\":document.getElementById(\"password\").value,};");
            client.println("// The data sent is what the user provided in the form");
            client.println("XHR.send(JSON.stringify(data));}");
            client.println("// Get the form element");
            client.println("const form = document.getElementById(\"myForm\");");
            client.println("// Add 'submit' event handler");
            client.println("form.addEventListener(\"submit\", (event) => { event.preventDefault(); sendData();});");
            client.println("}); </script>");
            client.println("</html>");

            // The HTTP response ends with another blank line
            client.println();
            // Break out of the while loop
            break;
          } else { // if you got a newline, then clear currentLine
            currentLine = "";
          }
        } else if (c != '\r') {  // if you got anything else but a carriage return character,
          currentLine += c;      // add it to the end of the currentLine
        }
      }
    }
    // Clear the header variable
    //header = "";
    // Close the connection
    client.stop();
    Serial.println("Client disconnected.");
    Serial.println("");
  }
}
