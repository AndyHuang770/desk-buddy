/*
 * esp32_client.ino
 * Desk Buddy – ESP32 text-only test client
 *
 * Reads a line from Serial, POSTs it to the Flask backend at
 * http://<SERVER_HOST>:5000/chat, and prints the reply back to Serial.
 * No mic or speaker needed for this smoke-test.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Configure these before uploading ────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST   = "192.168.1.100";   // IP of the machine running server.py
// ────────────────────────────────────────────────────────────────────────────

String serverUrl;

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());

  serverUrl = String("http://") + SERVER_HOST + ":5000/chat";
  Serial.println("Type a homework problem and press Enter:");
}

void loop() {
  if (!Serial.available()) return;

  String userMessage = Serial.readStringUntil('\n');
  userMessage.trim();
  if (userMessage.length() == 0) return;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi disconnected – reconnecting…");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Build JSON payload
  StaticJsonDocument<512> reqDoc;
  reqDoc["message"] = userMessage;
  String reqBody;
  serializeJson(reqDoc, reqBody);

  int statusCode = http.POST(reqBody);

  if (statusCode == 200) {
    String respBody = http.getString();
    StaticJsonDocument<1024> respDoc;
    DeserializationError err = deserializeJson(respDoc, respBody);
    if (!err && respDoc.containsKey("reply")) {
      Serial.println("[Buddy] " + String(respDoc["reply"].as<const char*>()));
    } else {
      Serial.println("[ERROR] Bad JSON in response: " + respBody);
    }
  } else {
    Serial.printf("[ERROR] HTTP %d: %s\n", statusCode, http.getString().c_str());
  }

  http.end();
  Serial.println("\nAsk another question:");
}
