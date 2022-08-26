#include <MQ135.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include "time.h"
#include <Wire.h>
#include <SPI.h>
#include "PietteTech_DHT.h"
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2561_U.h>
#include <Adafruit_BMP280.h>
#include <Preferences.h>

//WIFI setup
WiFiClient wifiClient;
WiFiServer server(80);

//WIFI AP setup
String header;
short resetPin = 5;                                  //if true then isServerMode wil be set to true. Device will start as AP
StaticJsonDocument<400> json_data_http;               //store JSON from config page (AP Html page)
const char* APssid     = "Atlantis-Hall-Access-Point";
const char* APpassword = "";                          //OpenNetwork
Preferences preferences;                              //Configs from memory
boolean isServerMode = true;                          //Define the mode for esp accesspoint\client
IPAddress IP;                                         //IP for AP
String accessPointAddress;                            //String type of IP variable

//Wifi client settings
String ssid;               //variable to store ssid during work
String password;           //variable to store password during work
String localAddress;       //variable to store ip address after connection

//Time settings
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 7200;
const int   daylightOffset_sec = 3600;
char timeStringBuff[30];

//mqtt settings
PubSubClient client(wifiClient);
long lastMsg = 0;
int value = 0;
char buffer[600];
const size_t CAPACITY = JSON_OBJECT_SIZE(25);
StaticJsonDocument<CAPACITY> doc;
String mqttaddress;                            //config block for user settings
String mqttdevicename;
String mqttlogin;
String mqttpassword;
String mqttpubname = "atlantis/hall";
String mqttsubname = "atlantis/hallnotify";

//DHT Sensor Config
#define DHTTYPE  DHT11
#define DHTPIN   33
void dht_wrapper();
PietteTech_DHT DHT(DHTPIN, DHTTYPE, dht_wrapper);
float dhtHumidity = 0;
float dhtTemp = 0;

//BMP280 sensor config
Adafruit_BMP280 bmp;
float bmpTmp = 0;
float bmpPrssr = 0;
float bmpAlttd = 0;

//GERKON sensor config
int gerkonPin = 18;
bool isDoorClosed;

//Vibro sensor config
#define vibroPin (39)
int vibroValue;

//MQ9 sensor config
float MQ9pin = 34;
float MQ9SensorVolt;
float MQ9RSAir; //  Rs in clean air
float MQ9R0;  // R0 in 1000 ppm LPG
float MQ9SensorValue;

//MQ135 sensor config
#define MQ135AnalogPin 35
#define MQ135DigitalPin 5
MQ135 MQ135GasSensor = MQ135(MQ135AnalogPin);
float MQ135ppm;
float MQ135rzero;
boolean MQ135DigitalValue;

//MOVE Sensor config
#define movePin 19
bool isMoveDetected;

//TSL2561 (LIGHT) Sensor config
Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(TSL2561_ADDR_FLOAT, 12345);
int lightValue;

void setup()
{
  Serial.begin(115200);
  Serial.println("Starting.......");

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

  if (isServerMode) {
    WiFi.mode(WIFI_MODE_AP);

    //setup ap to config connection
    Serial.print("Setting AP (Access Point)…");
    WiFi.softAP(APssid, APpassword);
    IPAddress IP = WiFi.softAPIP();
    accessPointAddress = IpAddress2String(IP);
        Serial.print("AP IP address: ");
        Serial.println(IP);
        Serial.print("AP IP String address: ");
        Serial.println(accessPointAddress);

    server.begin();
  } else {
    WiFi.mode(WIFI_MODE_STA);


    //WiFi.onEvent(WiFiEvent);
    connectToWifi();
    //Setup MQTT
    Serial.println("Connecting to mqtt server......");
    client.setServer(mqttaddress.c_str(), 1883);
    client.setBufferSize(420);
    client.subscribe(mqttsubname.c_str());
    client.setCallback(callback);
    Serial.println("Setup pins......");
    //Sensors INIT&Config
    //DHT
    initDHTSensor();
    //BMP280
    if (!bmp.begin(0x76)) {
      Serial.println(F("Could not find a valid BMP280 sensor, check wiring or "
                       "try a different address!"));
      Serial.print("SensorID was: 0x"); Serial.println(bmp.sensorID(), 16);
    }
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,     /* Operating Mode. */
                    Adafruit_BMP280::SAMPLING_X2,     /* Temp. oversampling */
                    Adafruit_BMP280::SAMPLING_X16,    /* Pressure oversampling */
                    Adafruit_BMP280::FILTER_X16,      /* Filtering. */
                    Adafruit_BMP280::STANDBY_MS_500); /* Standby time. */
    //Gerkon
    pinMode(gerkonPin, INPUT);
    //Vibro
    pinMode(vibroPin, INPUT);
    //MQ9
    pinMode(MQ9pin, INPUT);
    //MQ135
    pinMode(MQ135DigitalPin, INPUT);
    //MOVE
    pinMode(movePin, INPUT);
    //Light
    if (!tsl.begin())
    {
      /* There was a problem detecting the TSL2561 ... check your connections */
      Serial.print("Ooops, no TSL2561 detected ... Check your wiring or I2C ADDR!");
      //while(1);
    }
    configureLightSensor();

    Serial.println("......SETUP DONE......");
    delay(1000);
  }
}

void loop() {
  if (isServerMode) {
    showConfigPage();
    return;
  }

  Serial.print("---MQTT TOPIC---");
  Serial.println(mqttpubname);
  Serial.println();
  delay(3000);//Wait 3 seconds before accessing sensor again.

  Serial.print("---WIFI STATE---");
  Serial.println(WiFi.status());
  Serial.println();
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }

  //Update gerkon state
  Serial.println("---DOOR STATE---");
  isDoorClosed = digitalRead(gerkonPin) == HIGH;
  if (isDoorClosed) {
    Serial.println("   |   Your Door is Closed");
  } else {
    Serial.println("   |   Your Door is Open");
  }

  //Update vibro state
  Serial.println("---VIBRO STATE---");
  vibroValue = pulseIn (vibroPin, HIGH);;
  Serial.print("   |   Value = "); Serial.println(vibroValue);
  if (vibroValue > 1000) {
    Serial.println("   |   > 1000. Broken Window");
  } else {
    Serial.println("   |   < 1000. Window OK.");
  }

  //Update DHT state
  Serial.println("---DHT11 STATE---");
  dhtHumidity = DHT.getHumidity();
  Serial.print("   |   Current DHT humidity = ");
  Serial.print(dhtHumidity);
  Serial.println("%  ");
  Serial.print("   |   Current DHT Temperature = ");
  dhtTemp = DHT.getCelsius();
  Serial.print(dhtTemp);
  Serial.println("C  ");

  //Update BMP280 state
  Serial.println("---BMP280 STATE---");
  bmpTmp = bmp.readTemperature();
  bmpPrssr = bmp.readPressure() / 100;
  bmpAlttd = bmp.readAltitude(1013.25);
  Serial.print("   |   Temp = ");
  Serial.print(bmpTmp);
  Serial.println(" *C  ");
  Serial.print("   |   Pressure= ");
  Serial.print(bmpPrssr);
  Serial.println(" hPa");
  Serial.print("   |   Approx altitude= ");
  Serial.print(bmpAlttd);
  Serial.println(" m");

  //Update MQ9 state
  //Average
  Serial.println("---MQ9 STATE---");
  MQ9SensorValue = 0;
  for (int x = 0 ; x < 100 ; x++) {
    MQ9SensorValue = MQ9SensorValue + analogRead(MQ9pin);
  }
  MQ9SensorValue = MQ9SensorValue / 100.0;

  Serial.print("   |    Sensor Value = ");
  Serial.println(MQ9SensorValue);

  MQ9SensorVolt = (MQ9SensorValue / 1024) * 5.0;
  MQ9RSAir = (5.0 - MQ9SensorVolt) / MQ9SensorVolt; // Depend on RL on yor module
  MQ9R0 = MQ9RSAir / 9.9; // According to MQ9 datasheet table

  Serial.print("   |    Sensor Volt = ");
  Serial.print(MQ9SensorVolt);
  Serial.println("V");

  Serial.print("   |    R0 = ");
  Serial.println(MQ9R0);

  //Update MQ135 state
  Serial.println("---MQ135 STATE---");
  MQ135ppm = MQ135GasSensor.getPPM();
  Serial.print("   |   (CO2 concentration) ppm : ");
  Serial.println(MQ135ppm);

  MQ135rzero = MQ135GasSensor.getRZero(); // read calibration data
  Serial.print("   |   rzero : ");      //norm 60.69 in h as calibration value
  Serial.println(MQ135rzero);
  Serial.print("   |   MQ135 Gas : ");
  Serial.println(analogRead(MQ135AnalogPin));

  MQ135DigitalValue = digitalRead(MQ135DigitalPin);
  Serial.print("   |   Threshold: ");
  Serial.println(MQ135DigitalValue);
  Serial.println();

  //Update Move state
  Serial.println("---MOVE STATE---");
  isMoveDetected = digitalRead(movePin) == HIGH;
  if (isMoveDetected) {
    Serial.println("   |   Movement detected.");
  } else {
    Serial.println("   |   Did not detect movement.");
  }

  //Update Light value
  sensors_event_t event;
  tsl.getEvent(&event);
  lightValue = event.light;
  Serial.println("---LIGHT STATE---");
  Serial.print("   |   light value= ");
  Serial.println(lightValue);

  //Update time state
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  printLocalTime();

  Serial.println("----TIME----");
  Serial.println(timeStringBuff);

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;

    // create an object
    JsonObject object = doc.to<JsonObject>();
    object["dTime"] = timeStringBuff;
    object["ssid"] = ssid;
    object["IP"] = localAddress;
    object["dhtHmdt"] = dhtHumidity;
    object["dhtTmp"] = dhtTemp;
    object["bmpTmp"] = bmpTmp;
    object["bmpPrssr"] = bmpPrssr;
    object["bmpAlttd"] = bmpAlttd;
    object["vibroV"] = vibroValue;
    object["MQ9V"] = MQ9SensorValue;
    object["MQ9Volt"] = MQ9SensorVolt;
    object["MQ9R0"] = MQ9R0;
    object["MQ135ppm"] = MQ135ppm;
    object["MQ135r0"] = MQ135rzero;
    object["MQ135DigV"] = MQ135DigitalValue;
    object["isMove"] = isMoveDetected;
    object["isClosed"] = isDoorClosed;
    object["lightV"] = lightValue;


    // Convert the value to a char array

    size_t n = serializeJson(doc, buffer);

    Serial.print("object: ");
    Serial.println(buffer);
    Serial.print("size: ");
    Serial.println(n);

    client.publish(mqttpubname.c_str(), buffer);
  }
}
//END of LOOP

void printLocalTime()
{
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  strftime(timeStringBuff, sizeof(timeStringBuff), "%F %H:%M:%S", &timeinfo);
}


void initDHTSensor() {
  Serial.println("Attempt to init DHT");
  int result = DHT.acquireAndWait(0);

  switch (result) {
      Serial.println(result);
    case DHTLIB_OK:
      Serial.println(FPSTR("DHT INIT OK!"));
      break;
    case DHTLIB_ERROR_CHECKSUM:
      Serial.println(FPSTR("Error DHT\n\r\tChecksum error"));
      break;
    case DHTLIB_ERROR_ISR_TIMEOUT:
      Serial.println(FPSTR("Error DHT ISR TimeOut"));
      break;
    case DHTLIB_ERROR_RESPONSE_TIMEOUT:
      Serial.println(FPSTR("Error DHT\n\r\tResponse time out error"));
      break;
    case DHTLIB_ERROR_DATA_TIMEOUT:
      Serial.println(FPSTR("Error DHT\n\r\tData TimeOut error"));
      break;
    case DHTLIB_ERROR_ACQUIRING:
      Serial.println(FPSTR("Error DHT\n\r\tAcquiring"));
      break;
    case DHTLIB_ERROR_DELTA:
      Serial.println(FPSTR("Error DHT\n\r\tDelta time to small"));
      break;
    case DHTLIB_ERROR_NOTSTARTED:
      Serial.println(FPSTR("Error DHT\n\r\tNot started"));
      break;
    default:
      Serial.println(FPSTR("DHT Unknown error"));
      Serial.println("DHT Unknown error");
      break;
  }
}

void dht_wrapper() {
  DHT.isrCallback();
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
  String messageTemp;

  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();

  // Feel free to add more if statements to control more GPIOs with MQTT

  if (messageTemp.equals("restart")) {
    ESP.restart();
  }
  // If a message is received on the topic esp32/output, you check if the message is either "on" or "off".
  // Changes the output state according to the message
  if (String(topic) == "esp32/hallComm") {
    Serial.print("Changing output to ");
    if (messageTemp == "on") {
      Serial.println("on");
      //  digitalWrite(ledPin, HIGH);
    }
    else if (messageTemp == "off") {
      Serial.println("off");
      // digitalWrite(ledPin, LOW);
    }
  }
}

String IpAddress2String(const IPAddress& ipAddress) {
  return String(ipAddress[0]) + String(".") + \
         String(ipAddress[1]) + String(".") + \
         String(ipAddress[2]) + String(".") + \
         String(ipAddress[3]) ;
}

static void WiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info)
{
  if (event == SYSTEM_EVENT_STA_DISCONNECTED) {
    if (info.disconnected.reason == 6) {
      Serial.println("NOT_AUTHED reconnect");
      WiFi.reconnect();
    }
  }
}

void configureLightSensor(void)
{
  /* You can also manually set the gain or enable auto-gain support */
  // tsl.setGain(TSL2561_GAIN_1X);      /* No gain ... use in bright light to avoid sensor saturation */
  // tsl.setGain(TSL2561_GAIN_16X);     /* 16x gain ... use in low light to boost sensitivity */
  tsl.enableAutoRange(true);            /* Auto-gain ... switches automatically between 1x and 16x */

  /* Changing the integration time gives you better sensor resolution (402ms = 16-bit data) */
  //tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_13MS);      /* fast but low resolution */
  tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_101MS);  /* medium resolution and speed   */
  // tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);  /* 16-bit data but slowest conversions */

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
            client.println("<title>Atlantis Hall Config Web Server</title>");
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
            client.println("<h1>Atlantis Hall Config Web Server</h1>");
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
            client.println("<input name=\"mqttdevicepublishtag\" type=\"text\" id=\"mqttdevicepublishtag\" value=\"" + mqttpubname + "\" disabled>");
            client.println("</div>");
            client.println("<div class=\"part\">");
            client.println("<input name=\"mqttdevicesubscribetag\" type=\"text\" id=\"mqttdevicesubscribetag\" value=\"" + mqttsubname + "\" disabled>");
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
