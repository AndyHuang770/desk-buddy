/*
 * voice_pipeline.ino
 * Desk Buddy – Full voice pipeline (INMP441 mic → Deepgram STT → Claude →
 *              Deepgram TTS → MAX98357A speaker)
 *
 * Hardware:
 *   INMP441  (I2S mic)       → I2S_NUM_0
 *   MAX98357A (I2S amp)      → I2S_NUM_1
 *   Push button              → BTN_PIN (active LOW, uses internal pull-up)
 *   Built-in LED             → LED_PIN (status indicator)
 *
 * Wiring:
 *   INMP441  VDD→3.3V  GND→GND  SCK→GPIO26  WS→GPIO25  SD→GPIO34  L/R→GND
 *   MAX98357A VIN→5V   GND→GND  BCLK→GPIO27  LRC→GPIO14  DIN→GPIO22
 *   Button   one leg→GPIO0, other leg→GND  (Boot button on most devkits)
 *
 * Usage:
 *   Press and hold the button to record (up to RECORD_SECS seconds).
 *   Release to send audio to the server.
 *   The buddy's spoken hint plays back automatically.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "driver/i2s.h"

// ── Configure before uploading ───────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST   = "192.168.1.100";  // LAN IP of machine running server.py
// ────────────────────────────────────────────────────────────────────────────

// Pin assignments
#define MIC_SCK_PIN  26
#define MIC_WS_PIN   25
#define MIC_SD_PIN   34
#define SPK_BCK_PIN  27
#define SPK_WS_PIN   14
#define SPK_DIN_PIN  22
#define BTN_PIN       0   // active LOW (Boot button)
#define LED_PIN       2   // built-in LED

// Audio settings
#define SAMPLE_RATE     16000
#define RECORD_SECS     4
#define I2S_READ_CHUNK  256                              // 32-bit frames per read
#define REC_SAMPLES     (SAMPLE_RATE * RECORD_SECS)     // 64 000 samples
#define REC_BYTES       (REC_SAMPLES * sizeof(int16_t)) // 128 000 bytes

// Recording buffer (128 KB global – fits in ESP32 DRAM with WiFi stack)
// If your board has PSRAM, replace with: int16_t *recBuf; and malloc in setup.
static int16_t recBuf[REC_SAMPLES];

String voiceUrl;

// ── I2S helpers ─────────────────────────────────────────────────────────────

void setupMic() {
  i2s_config_t cfg = {};
  cfg.mode              = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX);
  cfg.sample_rate       = SAMPLE_RATE;
  cfg.bits_per_sample   = I2S_BITS_PER_SAMPLE_32BIT; // INMP441 always sends 32-bit frames
  cfg.channel_format    = I2S_CHANNEL_FMT_ONLY_LEFT;
  cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  cfg.intr_alloc_flags  = ESP_INTR_FLAG_LEVEL1;
  cfg.dma_buf_count     = 4;
  cfg.dma_buf_len       = 256;
  cfg.use_apll          = false;
  cfg.tx_desc_auto_clear = false;

  i2s_pin_config_t pins = {};
  pins.bck_io_num       = MIC_SCK_PIN;
  pins.ws_io_num        = MIC_WS_PIN;
  pins.data_out_num     = I2S_PIN_NO_CHANGE;
  pins.data_in_num      = MIC_SD_PIN;

  ESP_ERROR_CHECK(i2s_driver_install(I2S_NUM_0, &cfg, 0, NULL));
  ESP_ERROR_CHECK(i2s_set_pin(I2S_NUM_0, &pins));
  i2s_zero_dma_buffer(I2S_NUM_0);
}

void setupSpeaker() {
  i2s_config_t cfg = {};
  cfg.mode              = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
  cfg.sample_rate       = SAMPLE_RATE;
  cfg.bits_per_sample   = I2S_BITS_PER_SAMPLE_16BIT;
  cfg.channel_format    = I2S_CHANNEL_FMT_ONLY_LEFT;
  cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  cfg.intr_alloc_flags  = ESP_INTR_FLAG_LEVEL1;
  cfg.dma_buf_count     = 4;
  cfg.dma_buf_len       = 256;
  cfg.use_apll          = false;
  cfg.tx_desc_auto_clear = true;   // silence on underrun

  i2s_pin_config_t pins = {};
  pins.bck_io_num       = SPK_BCK_PIN;
  pins.ws_io_num        = SPK_WS_PIN;
  pins.data_out_num     = SPK_DIN_PIN;
  pins.data_in_num      = I2S_PIN_NO_CHANGE;

  ESP_ERROR_CHECK(i2s_driver_install(I2S_NUM_1, &cfg, 0, NULL));
  ESP_ERROR_CHECK(i2s_set_pin(I2S_NUM_1, &pins));
  i2s_zero_dma_buffer(I2S_NUM_1);
}

// ── Recording ────────────────────────────────────────────────────────────────

size_t recordAudio() {
  Serial.println("[REC] Hold button – recording…");
  digitalWrite(LED_PIN, HIGH); // LED on = recording

  size_t pos = 0;
  static int32_t raw[I2S_READ_CHUNK];

  while (digitalRead(BTN_PIN) == LOW && pos < REC_SAMPLES) {
    size_t bytesRead = 0;
    i2s_read(I2S_NUM_0, raw, sizeof(raw), &bytesRead, portMAX_DELAY);
    size_t frames = bytesRead / sizeof(int32_t);
    for (size_t i = 0; i < frames && pos < REC_SAMPLES; i++) {
      // INMP441 data is in upper 24 bits of the 32-bit frame.
      // Right-shift by 11 gives a well-scaled 16-bit signed sample.
      recBuf[pos++] = (int16_t)(raw[i] >> 11);
    }
  }

  digitalWrite(LED_PIN, LOW);
  Serial.printf("[REC] Captured %u samples (%.1f s)\n", pos, (float)pos / SAMPLE_RATE);
  return pos;
}

// ── Upload & stream playback ─────────────────────────────────────────────────

void uploadAndPlay(size_t samples) {
  if (samples == 0) {
    Serial.println("[WARN] No audio captured – skipping upload.");
    return;
  }

  size_t byteLen = samples * sizeof(int16_t);
  Serial.printf("[NET] Uploading %u bytes to %s …\n", byteLen, voiceUrl.c_str());

  // Blink LED while uploading
  HTTPClient http;
  http.begin(voiceUrl);
  http.setTimeout(40000); // STT + LLM + TTS can take ~10 s
  http.addHeader("Content-Type", "application/octet-stream");
  // Tell server the recording params so it can build the WAV header correctly
  http.addHeader("X-Sample-Rate", String(SAMPLE_RATE));
  http.addHeader("X-Channels",    "1");
  http.addHeader("X-Bit-Depth",   "16");

  int status = http.POST((uint8_t*)recBuf, byteLen);
  if (status != 200) {
    Serial.printf("[ERR] Server returned HTTP %d\n", status);
    http.end();
    return;
  }

  // Stream response PCM directly into I2S – no need for a second large buffer
  Serial.println("[PLAY] Streaming reply…");
  int remaining = http.getSize(); // -1 for chunked transfer
  WiFiClient* stream = http.getStreamPtr();

  static uint8_t chunk[512];
  while (http.connected() && (remaining > 0 || remaining == -1)) {
    size_t avail = stream->available();
    if (avail) {
      size_t toRead = min(avail, sizeof(chunk));
      int got = stream->readBytes(chunk, toRead);
      if (got > 0) {
        size_t written = 0;
        i2s_write(I2S_NUM_1, chunk, (size_t)got, &written, portMAX_DELAY);
        if (remaining > 0) remaining -= got;
      }
    } else {
      delay(1); // yield while waiting for more data
    }
  }

  http.end();

  // Flush any remaining samples in the I2S TX FIFO
  i2s_zero_dma_buffer(I2S_NUM_1);
  Serial.println("[PLAY] Done.");
}

// ── Arduino entry points ─────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Rapid blink = connecting to WiFi
  Serial.print("[NET] Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(300);
    Serial.print(".");
  }
  digitalWrite(LED_PIN, LOW);
  Serial.println();
  Serial.print("[NET] Connected. IP: ");
  Serial.println(WiFi.localIP());

  voiceUrl = String("http://") + SERVER_HOST + ":5000/voice";

  setupMic();
  setupSpeaker();

  Serial.println("[OK] Ready. Press and hold the button to ask a question.");
}

void loop() {
  // Wait for button press (active LOW)
  if (digitalRead(BTN_PIN) != LOW) {
    delay(10);
    return;
  }

  // Debounce
  delay(50);
  if (digitalRead(BTN_PIN) != LOW) return;

  // Record while button is held
  size_t samples = recordAudio();

  // Upload to backend, play back the hint
  uploadAndPlay(samples);

  Serial.println("[OK] Ready. Press and hold to ask another question.");
}
