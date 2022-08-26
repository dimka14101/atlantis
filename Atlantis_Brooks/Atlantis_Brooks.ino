#include "PietteTech_DHT.h"
#include <SPI.h>
#include <TFT_eSPI.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <BH1750.h>
//#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <JPEGDecoder.h> // JPEG decoder library
#include "config.h"
#include "time.h"
#include <Preferences.h>

//files with icons for UI
#include "sun_icon.h"
#include "plant_icon.h"
#include "temp_icon.h"
#include "pressure_icon.h"
#include "alttd_icon.h"
#include "humidity_icon.h"
#include "wind_icon.h"
#include "status_good_icon.h"
#include "status_warning_icon.h"

#include <PubSubClient.h>

// Return the minimum of two values a and b
#define minimum(a,b)     (((a) < (b)) ? (a) : (b))

//WIFI setup
WiFiClient wifiClient;
WiFiServer server(80);

//WIFI AP setup
String header;
long startSequenceTime;
short resetPin = 15;                                  //if true then isServerMode wil be set to true. Device will start as AP
StaticJsonDocument<400> json_data_http;               //store JSON from config page (AP Html page)
const char* APssid     = "Atlantis-Brooks-Access-Point";
const char* APpassword = "";                          //OpenNetwork
Preferences preferences;                              //Configs from memory
boolean isServerMode = true;                          //Define the mode for esp accesspoint\client
IPAddress IP;                                         //IP for AP
String accessPointAddress;                            //String type of IP variable

//Wifi client settings
String ssid;               //variable to store ssid during work
String password;           //variable to store password during work
String localAddress;       //variable to store ip address after connection

//sensor variables
Adafruit_BMP085 bmp;
BH1750 lightMeter;
#define DHTTYPE  DHT11
#define DHTPIN   33
void dht_wrapper();
PietteTech_DHT DHT(DHTPIN, DHTTYPE, dht_wrapper);

//GERKON sensor config
int gerkonPin = 17;
bool isDoorClosed;

//Vibro sensor config
#define vibroPin (32)
int vibroValue;

//MOVE Sensor config
#define movePin 16
bool isMoveDetected;

//Time settings
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 7200;
const int   daylightOffset_sec = 3600;
char timeStringBuff[30];

//mqtt settings
PubSubClient client(wifiClient);
long lastMsg = 0;
char buffer[600];
int value = 0;
const size_t CAPACITY = JSON_OBJECT_SIZE(17);
StaticJsonDocument<CAPACITY> doc;
boolean isAtlantisOK = true;                   //system status. received from web service
String alarmMessage = "";                      //system alarm msg. received from web service
String mqttaddress;                            //config block for user settings
String mqttdevicename;
String mqttlogin;
String mqttpassword;
String mqttpubname = "atlantis/brooks";
String mqttsubname = "atlantis/brooksnotify";

//display object (library init)
TFT_eSPI tft = TFT_eSPI();

//counter for iterations
//used to check when its not encreaseed to handle any
//controller work freez\delays\reboots etc..
unsigned long iterationCount = 0;
unsigned long maxIteration = 1000000;

//sensors data to make them available in all sketch
float luminosity = 0;
float bmpTemp = 0;
float bmpPressure = 0;
float bmpAlttd = 0;
float bmpSeaLvlPrsr = 0;
float bmpRealAlttd = 0;
float dhtHumidity = 0;
float dhtTemp = 0;

//critical boards for future notifications and user warnings
short minTemp = 20;
short maxTemp = 30;
short minHumidity = 20;
short maxHumidity = 60;
short minLight = 0; //totaly dark
short maxLight = 32000; //sunshine day

//speaker settings
byte speakerPin = 4;
byte length = 4; // the number of notes
char notes[] = "ccgg"; // a space represents a rest
byte beats[] = { 1, 1, 1, 1 };
short tempo = 300;

//plant status to show correct icon
bool isPlantStatusOK = true;

//task variables to make some jobs work in separate core
TaskHandle_t NOT_USED_Job = NULL;
TaskHandle_t DisplayUpdateJob = NULL;
SemaphoreHandle_t xMutex;                //NOT USED

//####################################################################################################
// Setup
//####################################################################################################
void setup() {
  Serial.begin(115200);
  xMutex = xSemaphoreCreateMutex();

  preferences.begin("app_configs", false);

  if (digitalRead(resetPin) == HIGH) {
    Serial.print("========WORK AS AP========");
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
  isServerMode = preferences.getBool("isServerMode", true);

  pinMode(speakerPin, OUTPUT);
  //SCREEN CONFIG
  tft.begin();
  tft.fillScreen(TFT_WHITE);
  tft.setRotation(2);
  tft.setTextColor(TFT_BLACK);  // Set text colour to black, no background (so transparent)

  if (isServerMode) {
    WiFi.mode(WIFI_MODE_AP);

    //setup ap to config connection
    Serial.print("Setting AP (Access Point)…");
    WiFi.softAP(APssid, APpassword);
    IPAddress IP = WiFi.softAPIP();
    accessPointAddress = IpAddress2String(IP);
    //NETWORK INFO ARE
    tft.fillRect(5, 45, 150, 20, TFT_WHITE);
    tft.setCursor(5, 45, 2);
    tft.print("Server in config mode. Open WIFI.");
    tft.fillRect(5, 60, 150, 20, TFT_WHITE);
    tft.setCursor(5, 60, 2);
    tft.print("Use access point below. Put IP in your browser.");
    tft.fillRect(5, 450, 150, 20, TFT_WHITE);
    tft.setCursor(5, 450, 2);
    tft.print("IP: ");
    tft.println(accessPointAddress);
    tft.fillRect(5, 465, 100, 20, TFT_WHITE);
    tft.setCursor(5, 465, 2);
    tft.print("SSID: ");
    tft.println(APssid);

    //    Serial.print("AP IP address: ");
    //    Serial.println(IP);
    //    Serial.print("AP IP String address: ");
    //    Serial.println(accessPointAddress);

    server.begin();
    //========================================================================
    //TODO, add logic for showing data on the screen
    //    lcd.setCursor(4, 0);
    //    lcd.print(F("  AP MODE. IP:"));
    //    lcd.setCursor(1, 1);
    //    lcd.print(accessPointAddress);
  } else {
    //INIT SENSORS
    connectToWifi();
    initBMP085Sensor();
    delay(1000);
    initLightSensor();
    delay(1000);
    initDHTSensor();
    delay(1000);
    //Gerkon
    pinMode(gerkonPin, INPUT);
    //Vibro
    pinMode(vibroPin, INPUT);
    //MOVE
    pinMode(movePin, INPUT);

    //Setup MQTT
    client.setServer(mqttaddress.c_str(), 1883);
    client.setBufferSize(370); //increase if data not sent
    client.subscribe("atlantis/brooksnotify");
    client.setCallback(callback);

    //CLEAR SCREEN AFTER INIT
    tft.fillScreen(TFT_WHITE);
    tft.setCursor(75, 5, 4);
    tft.println("Brooks Assistant");  // As we use println, the cursor moves to the next line

    //SUN ICON
    drawArrayJpeg(sun_icon, sizeof(sun_icon), 20, 20); // Draw a jpeg image stored in memory at x,y
    //PLAN ICON
    drawArrayJpeg(plant_icon, sizeof(plant_icon), 10, 75);

    //PRESSURE SENSOR DATA AREA
    tft.drawRoundRect(140, 75, 165, 110, 10, TFT_BLACK);
    tft.drawCentreString("Pressure sensor data", 225, 75, 2);
    //TEMPERATURE ICON
    drawArrayJpeg(temp_icon, sizeof(temp_icon), 145, 90);
    //PRESSURE ICON
    drawArrayJpeg(pressure_icon, sizeof(pressure_icon), 145, 120);
    //ALTITUDE ICON
    drawArrayJpeg(alttd_icon, sizeof(alttd_icon), 145, 150);

    //HUMIDITY SENSOR DATA AREA
    tft.drawRoundRect(140, 195, 165, 85, 10, TFT_BLACK);
    tft.drawCentreString("Humidity sensor data", 225, 195, 2);
    //HUMIDITY ICON
    drawArrayJpeg(humidity_icon, sizeof(humidity_icon), 145, 210);
    //TEMPERATURE ICON
    drawArrayJpeg(temp_icon, sizeof(temp_icon), 145, 240);

    //MOTION SENSOR DATA AREA
    tft.drawRoundRect(15, 290, 290, 75, 10, TFT_BLACK);
    tft.drawCentreString("Motion:", 50, 295, 2);
    tft.drawCentreString("Window closed:", 140, 295, 2);
    tft.drawCentreString("Window vibro:", 250, 295, 2);


    //NETWORK INFO ARE
    tft.fillRect(5, 450, 150, 20, TFT_WHITE);
    tft.setCursor(5, 450, 2);
    tft.print("IP: ");
    tft.println(localAddress);
    tft.fillRect(5, 465, 100, 20, TFT_WHITE);
    tft.setCursor(5, 465, 2);
    tft.print("SSID: ");
    tft.println(ssid);

    //TASKS CONFIG AREA
    xTaskCreatePinnedToCore(
      DisplayUpdateTask,  /* Task function. */
      "DisplayUpdateTask",/* name of task. */
      10000,         /* Stack size of task */
      NULL,          /* parameter of the task */
      2,             /* priority of the task */
      &DisplayUpdateJob, /* Task handle to keep track of created task */
      0);
    //  xTaskCreatePinnedToCore(
    //                    NOT_USED_Task,  /* Task function. */
    //                    "NOT_USED_Task",/* name of task. */
    //                    10000,         /* Stack size of task */
    //                    NULL,          /* parameter of the task */
    //                    2,             /* priority of the task */
    //                    &NOT_USED_Job, /* Task handle to keep track of created task */
    //                    0);

    // if (DisplayUpdateJob != NULL) {
    vTaskResume(DisplayUpdateJob);
    //  }
  }
}

//####################################################################################################
// Main loop
//####################################################################################################
void loop() {
  if (isServerMode) {
    showConfigPage();
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }
  // xSemaphoreTake( xMutex, portMAX_DELAY );
  //FETCHING DATA FROM SENSORS
  getDHTData();
  getLightness();
  getBMP085DATA();

  //Update gerkon state
  Serial.print("---DOOR STATE---");
  isDoorClosed = digitalRead(gerkonPin) == HIGH;
  Serial.println(isDoorClosed);

  //Update vibro state
  Serial.print("---VIBRO STATE---");
  vibroValue = pulseIn(vibroPin, HIGH);
  Serial.println(vibroValue);


  //Update Move state
  Serial.print("---MOVE STATE---");
  isMoveDetected = digitalRead(movePin) == HIGH;
  Serial.println(isMoveDetected);


  //Update time state
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  printLocalTime();

  delay(2000);

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
    object["luminosity"] = luminosity;
    object["bmpTemp"] = bmpTemp;
    object["bmpPressure"] = bmpPressure;
    object["bmpAlttd"] = bmpAlttd;
    object["bmpSeaLvlPrsr"] = bmpSeaLvlPrsr;
    object["bmpRealAlttd"] = bmpRealAlttd;
    object["dhtHumidity"] = dhtHumidity;
    object["dhtTemp"] = dhtTemp;
    object["vibroV"] = vibroValue;
    object["isMove"] = isMoveDetected;
    object["isClosed"] = isDoorClosed;
    //
    // Convert the value to a char array
    size_t n = serializeJson(doc, buffer);

    Serial.print("object: ");
    Serial.println(buffer);
    client.publish("atlantis/brooks", buffer);
  }
  // xSemaphoreGive( xMutex );
}

void showWarningsFromPlant(char* msg) {
  //PLANT CRITICAL DATA CHECK AREA
  isPlantStatusOK = false;
  //clear sector
  tft.fillRect(10, 205, 130, 60, TFT_WHITE);
  //place cursor to show warning
  tft.setCursor(10, 245, 4);
  tft.setTextFont(2);
  tft.println(msg);
  tft.setTextColor(TFT_RED);

}
//####################################################################################################
// Draw a JPEG on the TFT pulled from a program memory array
//####################################################################################################
void drawArrayJpeg(const uint8_t arrayname[], uint32_t array_size, int xpos, int ypos) {

  int x = xpos;
  int y = ypos;

  JpegDec.decodeArray(arrayname, array_size);

  //jpegInfo(); // Print information from the JPEG file (could comment this line out)

  renderJPEG(x, y);

  Serial.println("#########################");
}

//####################################################################################################
// Draw a JPEG on the TFT, images will be cropped on the right/bottom sides if they do not fit
//####################################################################################################
// This function assumes xpos,ypos is a valid screen coordinate. For convenience images that do not
// fit totally on the screen are cropped to the nearest MCU size and may leave right/bottom borders.
void renderJPEG(int xpos, int ypos) {

  // retrieve infomration about the image
  uint16_t *pImg;
  uint16_t mcu_w = JpegDec.MCUWidth;
  uint16_t mcu_h = JpegDec.MCUHeight;
  uint32_t max_x = JpegDec.width;
  uint32_t max_y = JpegDec.height;

  // Jpeg images are draw as a set of image block (tiles) called Minimum Coding Units (MCUs)
  // Typically these MCUs are 16x16 pixel blocks
  // Determine the width and height of the right and bottom edge image blocks
  uint32_t min_w = minimum(mcu_w, max_x % mcu_w);
  uint32_t min_h = minimum(mcu_h, max_y % mcu_h);

  // save the current image block size
  uint32_t win_w = mcu_w;
  uint32_t win_h = mcu_h;

  // record the current time so we can measure how long it takes to draw an image
  uint32_t drawTime = millis();

  // save the coordinate of the right and bottom edges to assist image cropping
  // to the screen size
  max_x += xpos;
  max_y += ypos;

  // read each MCU block until there are no more
  while (JpegDec.readSwappedBytes()) {

    // save a pointer to the image block
    pImg = JpegDec.pImage ;

    // calculate where the image block should be drawn on the screen
    int mcu_x = JpegDec.MCUx * mcu_w + xpos;  // Calculate coordinates of top left corner of current MCU
    int mcu_y = JpegDec.MCUy * mcu_h + ypos;

    // check if the image block size needs to be changed for the right edge
    if (mcu_x + mcu_w <= max_x) win_w = mcu_w;
    else win_w = min_w;

    // check if the image block size needs to be changed for the bottom edge
    if (mcu_y + mcu_h <= max_y) win_h = mcu_h;
    else win_h = min_h;

    // copy pixels into a contiguous block
    if (win_w != mcu_w)
    {
      uint16_t *cImg;
      int p = 0;
      cImg = pImg + win_w;
      for (int h = 1; h < win_h; h++)
      {
        p += mcu_w;
        for (int w = 0; w < win_w; w++)
        {
          *cImg = *(pImg + w + p);
          cImg++;
        }
      }
    }

    // draw image MCU block only if it will fit on the screen
    if (( mcu_x + win_w ) <= tft.width() && ( mcu_y + win_h ) <= tft.height())
    {
      tft.pushRect(mcu_x, mcu_y, win_w, win_h, pImg);
    }
    else if ( (mcu_y + win_h) >= tft.height()) JpegDec.abort(); // Image has run off bottom of screen so abort decoding
  }

  // calculate how long it took to draw the image
  drawTime = millis() - drawTime;

  // print the results to the serial port
  //Serial.print(F(  "Total render time was    : ")); Serial.print(drawTime); Serial.println(F(" ms"));
  Serial.println(F(""));
}

void lcdShowSensorStatus(const __FlashStringHelper  *msg) {
  char text[30];
  strncpy_P(text, (const char*)msg, 30);

  tft.fillRect(55, 415, 200, 20, TFT_WHITE);
  tft.setCursor(55, 415, 2);
  tft.print(text);
}

void initBMP085Sensor() {
  if (!bmp.begin()) {
    Serial.println(FPSTR("Could not find a valid BMP085/BMP180 sensor, check wiring!"));
    lcdShowSensorStatus(FPSTR("BMP085 INIT ERROR!"));
  } else {
    Serial.println(FPSTR("BMP085/BMP180 sensor init OK!"));
    lcdShowSensorStatus(FPSTR("BMP085 INIT OK!"));
  }
}

void initLightSensor() {
  Wire.begin();
  lightMeter.begin();

  Serial.println(FPSTR("BH1750 INIT OK!"));
  lcdShowSensorStatus(FPSTR("BH1750 INIT OK!"));
}

void initDHTSensor() {
  int result = DHT.acquireAndWait(0);

  switch (result) {
    case DHTLIB_OK:
      Serial.println(FPSTR("DHT INIT OK!"));
      lcdShowSensorStatus(FPSTR("DHT INIT OK!"));
      break;
    case DHTLIB_ERROR_CHECKSUM:
      Serial.println(FPSTR("Error\n\r\tChecksum error"));
      lcdShowSensorStatus(FPSTR("ERR Checksum"));
      break;
    case DHTLIB_ERROR_ISR_TIMEOUT:
      Serial.println(FPSTR("Error ISR TimeOut"));
      lcdShowSensorStatus(FPSTR("ERR ISR TimeOut"));
      break;
    case DHTLIB_ERROR_RESPONSE_TIMEOUT:
      Serial.println(FPSTR("Error\n\r\tResponse time out error"));
      lcdShowSensorStatus(FPSTR("ERR RSP TimeOut"));
      break;
    case DHTLIB_ERROR_DATA_TIMEOUT:
      Serial.println(FPSTR("Error\n\r\tData TimeOut error"));
      lcdShowSensorStatus(FPSTR("ERR Data TimeOut"));
      break;
    case DHTLIB_ERROR_ACQUIRING:
      Serial.println(FPSTR("Error\n\r\tAcquiring"));
      lcdShowSensorStatus(FPSTR("ERR Acquiring"));
      break;
    case DHTLIB_ERROR_DELTA:
      Serial.println(FPSTR("Error\n\r\tDelta time to small"));
      lcdShowSensorStatus(FPSTR("ERR DLTTimeToLow"));
      break;
    case DHTLIB_ERROR_NOTSTARTED:
      Serial.println(FPSTR("Error\n\r\tNot started"));
      lcdShowSensorStatus(FPSTR("ERR Not started"));
      break;
    default:
      Serial.println(FPSTR("Unknown error"));
      lcdShowSensorStatus(FPSTR("Unknown error"));
      break;
  }
}

void dht_wrapper() {
  DHT.isrCallback();
}

void getLightness() {
  luminosity = lightMeter.readLightLevel();
  //  Serial.print("Light: ");
  //  Serial.print(luminosity);
  //  Serial.println(" lx");
}

void getDHTData() {
  dhtHumidity = DHT.getHumidity();
  //    Serial.print("DHT-->Humidity(%):");
  //    Serial.print(dhtHumidity, 2);

  dhtTemp = DHT.getCelsius();
  //    Serial.print(", Temp(oC):");
  //    Serial.print(dhtTemp, 2);
  //
  //    Serial.print(", Temp(oF):");
  //    Serial.print(DHT.getFahrenheit(), 2);
  //
  //    Serial.print(", Temp(K):");
  //    Serial.print(DHT.getKelvin(), 2);
  //
  //    Serial.print(", DewPoint(oC):");
  //    Serial.print(DHT.getDewPoint());
  //
  //    Serial.print(", DewPointSlow(oC):");
  //    Serial.print(DHT.getDewPointSlow());
  Serial.println();
}

void getBMP085DATA() {
  bmpTemp = bmp.readTemperature();
  //  Serial.print("BMP-->Temp = ");
  //  Serial.print(bmpTemp);
  //  Serial.print("`C");

  bmpPressure = bmp.readPressure() / 100;
  //  Serial.print(", Pressure = ");
  //  Serial.print(bmpPressure);
  //  Serial.print("Pa");

  // Calculate altitude assuming 'standard' barometric
  // pressure of 1013.25 millibar = 101325 Pascal
  bmpAlttd = bmp.readAltitude();
  //  Serial.print(", Altitude = ");
  //  Serial.print(bmpAlttd);
  //  Serial.print("meters");

  bmpSeaLvlPrsr = bmp.readSealevelPressure();
  //  Serial.print(", Pressure at sealevel (calculated) = ");
  //  Serial.print(bmpSeaLvlPrsr);
  //  Serial.print("Pa");

  // you can get a more precise measurement of altitude
  // if you know the current sea level pressure which will
  // vary with weather and such. If it is 1015 millibars
  // that is equal to 101500 Pascals.
  bmpRealAlttd = bmp.readAltitude(102000);
  //  Serial.print(", Real altitude = ");
  //  Serial.print(bmpRealAlttd);
  //  Serial.print(" meters");
  Serial.println();
}

void connectToWifi() {
  Serial.print("connectToWifi called...");
  WiFi.begin(ssid.c_str(), password.c_str());
  WiFi.setSleep(false);
  Serial.println("Connecting to Wifi");
  tft.setCursor(75, 5, 4);
  tft.println("Connecting to Wifi");
  tft.setCursor(15, 25, 4);
  byte x = 10;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    tft.println(".");
    tft.setCursor(x, 25, 4);
    x = x + 10;
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  localAddress = IpAddress2String(WiFi.localIP());
  Serial.println(localAddress);

  String welcome = "Hi, \n";
  welcome += "BrooksAssistant is online.\n\n";
  welcome += "/start to request available commands \n";
  //bot.sendMessage(CHAT_ID, welcome, "");          //disabled during development


  //  if (BotMessagesFetchJob != NULL) {
  //    vTaskResume(BotMessagesFetchJob);
  //  }
}

void DisplayUpdateTask( void * pvParameters ) {
  Serial.print("DisplayUpdateTask running on core ");
  Serial.println(xPortGetCoreID());

  for (;;) {
    Serial.println("DisplayUpdateTask gains key");
    xSemaphoreTake( xMutex, portMAX_DELAY );
    delay(5000);
    Serial.println();

    //UPDATE LIGHTNING DATA
    tft.setTextColor(TFT_BLACK);
    if (luminosity >= maxLight) {
      showWarningsFromPlant("Too much light");
    } else if (luminosity >= maxLight) {
      showWarningsFromPlant("Not enought light");
    } else {
      tft.setTextColor(TFT_BLACK);
    }
    tft.fillRect(85, 35, 150, 20, TFT_WHITE);
    tft.setCursor(85, 35, 4);
    tft.print(luminosity);  // As we use println, the cursor moves to the next line
    tft.println(" lx");

    //UPDATE PRESSURE SENSOR AREA
    //clear sector
    tft.fillRect(180, 95, 90, 85, TFT_WHITE);
    //temp
    tft.setTextColor(TFT_BLACK);
    if (bmpTemp <= minTemp) {
      showWarningsFromPlant("I`ts too cold");
    } else if (bmpTemp >= maxTemp) {
      showWarningsFromPlant("I`ts too hot");
    } else {
      tft.setTextColor(TFT_BLACK);
    }
    tft.setCursor(180, 95, 4);
    tft.print(bmpTemp);  // As we use println, the cursor moves to the next line
    tft.println("  `C");
    //pressure
    tft.setCursor(180, 125, 4);
    tft.print(bmpPressure, 1);  // As we use println, the cursor moves to the next line
    tft.println(" hPa");
    //Altitude
    tft.setCursor(180, 155, 4);
    tft.print(bmpAlttd, 1);  // As we use println, the cursor moves to the next line
    tft.println(" m");

    //UPDATE HUMIDITY SENSOR DATA AREA
    //clear sector
    tft.fillRect(180, 215, 50, 20, TFT_WHITE);
    //humidity
    tft.setTextColor(TFT_BLACK);
    if (dhtHumidity <= minHumidity) {
      showWarningsFromPlant("I need more humidity");
    } else if (dhtHumidity >= maxHumidity) {
      showWarningsFromPlant("I need less humidity");
    } else {
      tft.setTextColor(TFT_BLACK);
    }
    tft.setCursor(180, 215, 4);
    tft.print(dhtHumidity);
    tft.println("  %");
    //temp
    tft.setTextColor(TFT_BLACK);
    if (dhtTemp <= minTemp) {
      showWarningsFromPlant("I`ts too cold");
    } else if (dhtTemp >= maxTemp) {
      showWarningsFromPlant("I`ts too hot");
    } else {
      tft.setTextColor(TFT_BLACK);
    }
    tft.fillRect(180, 245, 50, 20, TFT_WHITE);
    tft.setCursor(180, 245, 4);
    tft.print(dhtTemp);
    tft.println("  `C");

    //UPDATE MOTION DATA
    tft.fillRect(30, 315, 50, 20, TFT_WHITE);
    tft.setCursor(30, 315, 4);
    if (isMoveDetected) {
      tft.setTextColor(TFT_RED);
      tft.print("YES");
    } else {
      tft.setTextColor(TFT_BLACK);
      tft.print("NO");
    }

    tft.fillRect(120, 315, 50, 20, TFT_WHITE);
    tft.setCursor(120, 315, 4);
    if (isDoorClosed) {
      tft.setTextColor(TFT_BLACK);
      tft.print("YES");
    } else {
      tft.setTextColor(TFT_RED);
      tft.print("NO");
    }

    tft.fillRect(210, 315, 90, 20, TFT_WHITE);
    if (vibroValue > 1000) {
      tft.setCursor(210, 315, 4);
      tft.setTextColor(TFT_RED);
      tft.print("ALARM");
    } else {
      tft.setCursor(230, 315, 4);
      tft.setTextColor(TFT_BLACK);
      tft.print("OK");
    }
    tft.fillRect(230, 335, 50, 20, TFT_WHITE);
    tft.setCursor(230, 335, 2);
    tft.print(vibroValue);


    //UPDATE PLANT STATUS
    if (isPlantStatusOK) {
      drawArrayJpeg(status_good_icon, sizeof(status_good_icon), 30, 220);
      tft.setCursor(50, 215, 4);
      tft.println("Good");
    } else {
      soundNotification();
      //warning icon
      drawArrayJpeg(status_warning_icon, sizeof(status_warning_icon), 30, 210);
      tft.setCursor(70, 215, 4);
      tft.println("Bad");
    }

    //ITERATIONS COUNTER AREA
    if (iterationCount < maxIteration) {
      iterationCount++;
    } else {
      iterationCount = 0;
    }

    tft.fillRect(5, 430, 200, 20, TFT_WHITE);
    tft.setCursor(5, 430, 2);
    tft.print("Iteration: ");
    tft.println(iterationCount);
    Serial.print("ITERATION === ");
    Serial.println(iterationCount);

    //TIME AREA
    tft.fillRect(130, 465, 200, 20, TFT_WHITE);
    tft.setCursor(130, 465, 2);
    tft.print("Time: ");
    tft.println(timeStringBuff);

    Serial.println("DisplayUpdateTask releases key");
    xSemaphoreGive( xMutex );
  }
}


void NOT_USED_Task (void * unused) {
  Serial.print("NOT_USED_Task running on core ");
  Serial.println(xPortGetCoreID());

  //  for(;;){
  //    Serial.println("WeatherFetchTask gains key");
  //    //xSemaphoreTake( xMutex, portMAX_DELAY );
  //    delay(5000);
  //
  //      } else {
  //        Serial.println("WiFi Disconnected");
  //        connectToWifi();
  //    }
  //    lastTime = millis();
  //  }
  //    Serial.println("NOT_USED_Task releases key");
  //  }
}

String IpAddress2String(const IPAddress& ipAddress) {
  return String(ipAddress[0]) + String(".") + \
         String(ipAddress[1]) + String(".") + \
         String(ipAddress[2]) + String(".") + \
         String(ipAddress[3])  ;
}

void soundNotification() {
  for (int i = 0; i < length; i++) {
    if (notes[i] == ' ') {
      delay(beats[i] * tempo); // rest
    } else {
      playNote(notes[i], beats[i] * tempo);
    }

    // pause between notes
    delay(tempo / 2);
  }
}

void playTone(int tone, int duration) {
  for (long i = 0; i < duration * 1000L; i += tone * 2) {
    digitalWrite(speakerPin, HIGH);
    delayMicroseconds(tone);
    digitalWrite(speakerPin, LOW);
    delayMicroseconds(tone);
  }
}

void playNote(char note, int duration) {

  char names[] = { 'c', 'g'};
  int tones[] = { 1915, 1275};

  // play the tone corresponding to the note name
  for (int i = 0; i < 8; i++) {
    if (names[i] == note) {
      playTone(tones[i], duration);
    }
  }
}

void printLocalTime()
{
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  strftime(timeStringBuff, sizeof(timeStringBuff), "%F %H:%M:%S", &timeinfo);
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

  if (messageTemp == "restart") {
    ESP.restart();
  }

  // Feel free to add more if statements to control more GPIOs with MQTT

  // If a message is received on the topic esp32/output, you check if the message is either "on" or "off".
  // Changes the output state according to the message
  if (String(topic) == "esp32/output") {
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

void reconnect() {
  Serial.print("Reconnect call - MQTT connection...");
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP32Brooks", "dimka14101", "dimka14101")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe("atlantis/brooksnotify");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
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
            client.println("<title>Atlantis Brooks Config Web Server</title>");
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
            client.println("<h1>Atlantis Brooks Config Web Server</h1>");
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
