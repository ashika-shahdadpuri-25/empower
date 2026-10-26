#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

#define LOG_MODE 0   //  0 = normal system

// Pins
const int TOUCH_PIN = 4;
const int LED_ARMED = 13;
const int LED_SOS = 12;
const int LED_ACK = 14;

// ---------- MATHS CONFIG ----------
const int   CAL_SAMPLES = 100;    // M
const int   FILTER_N    = 5;      // N (choose from your data)
const float K_SIGMA     = 3.0;    // k (choose from your data)
const float MIN_MARGIN  = 8.0;    // floor so threshold never sits on the mean

float mu = 0, sigma = 0, threshold = 40;
float winBuf[FILTER_N];
int   winIdx = 0;
float rawValue = 0, filtered = 0;
float minInWindow = 1e9;

bool touching = false;
unsigned long touchStartMs = 0;
float pressSec = 0;

void calibrate() {
  float sum = 0, sq = 0;
  for (int i = 0; i < CAL_SAMPLES; i++) {
    float v = touchRead(TOUCH_PIN);
    sum += v; sq += v * v;
    delay(20);
  }
  mu = sum / CAL_SAMPLES;
  float var = sq / CAL_SAMPLES - mu * mu;
  if (var < 0) var = 0;
  sigma = sqrt(var);
  threshold = mu - max(K_SIGMA * sigma, MIN_MARGIN);
  for (int i = 0; i < FILTER_N; i++) winBuf[i] = mu;
  Serial.printf("CAL mu=%.2f sigma=%.2f threshold=%.2f\n", mu, sigma, threshold);
}

// Called once per loop (~20 ms)
void updateMath() {
  rawValue = touchRead(TOUCH_PIN);
  winBuf[winIdx] = rawValue;
  winIdx = (winIdx + 1) % FILTER_N;
  float s = 0;
  for (int i = 0; i < FILTER_N; i++) s += winBuf[i];
  filtered = s / FILTER_N;
  if (filtered < minInWindow) minInWindow = filtered;

  bool now = filtered < threshold;   // classic ESP32: value DROPS on touch
  if (now && !touching) { touching = true; touchStartMs = millis(); }
  if (!now) touching = false;
  pressSec = touching ? (millis() - touchStartMs) / 1000.0f : 0;
}

bool isTouched() { return touching; }

// FSM States
enum State { ARMED, COUNTING, SOS_PENDING, SENT, DELIVERY_FAILED };
State currentState = ARMED;

// Timing & Tap Tracking
unsigned long tapTimestamps[10];
int tapCount = 0;
const unsigned long WINDOW_MS = 2000;
unsigned long firstTapTime = 0;

// Debounce variables
unsigned long lastTouchTime = 0;
const unsigned long DEBOUNCE_MS = 200;
bool wasTouched = false;

// Non-blocking reset timer
unsigned long resultAt = 0;
const unsigned long RESULT_HOLD_MS = 3000;

// Telemetry timer
unsigned long lastTele = 0;
const unsigned long TELE_EVERY_MS = 1000;

void updateLEDs() {
  digitalWrite(LED_ARMED, currentState == ARMED ? HIGH : LOW);
  digitalWrite(LED_SOS, (currentState == COUNTING || currentState == SOS_PENDING || currentState == DELIVERY_FAILED) ? HIGH : LOW);
  digitalWrite(LED_ACK, currentState == SENT ? HIGH : LOW);
}

void sendAlert() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, SERVER_HOST, SERVER_PORT, "/api/alerts");
    http.addHeader("Content-Type", "application/json");

    // mean interval between taps (ms) = (last - first) / (n - 1)
    float meanIntervalMs = (tapCount > 1)
      ? (float)(tapTimestamps[tapCount - 1] - tapTimestamps[0]) / (tapCount - 1)
      : 0;

    StaticJsonDocument<384> doc;
    doc["deviceId"] = "empower-demo-01";
    doc["eventId"] = String(millis());
    doc["eventType"] = "SOS";
    doc["tapCount"] = tapCount;
    doc["windowMs"] = WINDOW_MS;
    doc["deviceUptimeMs"] = millis();
    // maths fields
    doc["mu"] = mu;
    doc["sigma"] = sigma;
    doc["threshold"] = threshold;
    doc["filtered"] = filtered;
    doc["pressSec"] = pressSec;
    doc["meanIntervalMs"] = meanIntervalMs;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode > 0) {
      Serial.printf("HTTP Response code: %d\n", httpResponseCode);
      currentState = SENT;
    } else {
      Serial.printf("Error on sending POST: %s\n", http.errorToString(httpResponseCode).c_str());
      currentState = DELIVERY_FAILED;
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
    currentState = DELIVERY_FAILED;
  }
  resultAt = millis();
  lastTele = 0;   // force a telemetry send on the next loop
}

void sendTelemetry() {
  if (millis() - lastTele < TELE_EVERY_MS) return;
  lastTele = millis();
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;
  http.setTimeout(1500);
  http.begin(client, SERVER_HOST, SERVER_PORT, "/api/telemetry");
  http.addHeader("Content-Type", "application/json");
  char buf[180];
  snprintf(buf, sizeof(buf),
    "{\"minInWindow\":%.1f,\"raw\":%.1f,\"threshold\":%.1f,\"mu\":%.1f,\"sigma\":%.2f,\"pressSec\":%.2f}",
    minInWindow, rawValue, threshold, mu, sigma, pressSec);
  http.POST(buf);
  http.end();
  minInWindow = 1e9;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_ARMED, OUTPUT);
  pinMode(LED_SOS, OUTPUT);
  pinMode(LED_ACK, OUTPUT);

#if LOG_MODE
  delay(2000);
  for (int i = 0; i < 1000; i++) { Serial.println(touchRead(TOUCH_PIN)); delay(20); }
  while (true) delay(1000);
#endif

  // Blink SOS LED during calibration so you know not to touch
  digitalWrite(LED_SOS, HIGH);
  Serial.println("Calibrating - do NOT touch the pad");
  calibrate();
  digitalWrite(LED_SOS, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void loop() {
  updateMath();
  updateLEDs();

  bool touchedNow = isTouched();

  // Debounce & Tap Detection
  if (touchedNow && !wasTouched && (millis() - lastTouchTime > DEBOUNCE_MS)) {
    lastTouchTime = millis();
    wasTouched = true;
    unsigned long now = millis();

    if (currentState == ARMED) {
      currentState = COUNTING;
      tapCount = 1;
      tapTimestamps[0] = now;
      firstTapTime = now;
      Serial.println("First tap detected. Counting...");
    } else if (currentState == COUNTING) {
      int validTaps = 0;
      unsigned long tempTimestamps[10];
      for (int i = 0; i < tapCount; i++) {
        if (now - tapTimestamps[i] <= WINDOW_MS) {
          tempTimestamps[validTaps++] = tapTimestamps[i];
        }
      }
      tempTimestamps[validTaps++] = now;
      tapCount = validTaps;
      for (int i = 0; i < tapCount; i++) tapTimestamps[i] = tempTimestamps[i];

      Serial.printf("Tap registered! Current count in window: %d\n", tapCount);

      if (tapCount >= 3) {
        Serial.println("SOS Pattern Recognized locally!");
        currentState = SOS_PENDING;
        sendAlert();
      }
    }
  } else if (!touchedNow) {
    wasTouched = false;
  }

  // Timeout in COUNTING state
  if (currentState == COUNTING && (millis() - firstTapTime > WINDOW_MS)) {
    Serial.println("Tap window expired. Resetting to ARMED.");
    tapCount = 0;
    currentState = ARMED;
  }

  // Non-blocking reset after SENT or DELIVERY_FAILED
  if ((currentState == SENT || currentState == DELIVERY_FAILED) &&
      (millis() - resultAt > RESULT_HOLD_MS)) {
    tapCount = 0;
    currentState = ARMED;
  }

  sendTelemetry();
  delay(20);   // Ts = 20 ms
}