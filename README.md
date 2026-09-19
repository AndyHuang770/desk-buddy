# Desk Buddy

An AI-powered study companion for kids. Feed it a homework problem and it
guides you to the answer with hints and questions — it never just gives the
answer away.

---

## Repo layout

```
desk-buddy/
  esp32_client/          # Arduino sketch for the ESP32
    esp32_client.ino
  backend/               # Python/Flask AI backend
    server.py
    requirements.txt
    .env.example
  desk-buddy/            # Next.js web app (existing)
```

---

## A – Flash the ESP32 (text-only smoke test)

### 1. Install the ESP32 board in Arduino IDE

1. Open **Arduino IDE** → Preferences → **Additional Boards Manager URLs** and add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
2. Tools → Board → Boards Manager → search **esp32** → install
   **"esp32 by Espressif Systems"**.
3. Tools → Board → ESP32 Arduino → **"ESP32 Dev Module"** (or your exact board).
4. Tools → Port → select the COM/tty port for your ESP32.

### 2. Install the ArduinoJson library

Sketch → Include Library → Manage Libraries → search **ArduinoJson** → install.

### 3. Configure credentials

Open `esp32_client/esp32_client.ino` and edit the three lines at the top:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST   = "192.168.1.100";  // LAN IP of the server machine
```

### 4. Upload & test

1. Click **Upload** (Ctrl+U).
2. Open **Serial Monitor** at **115 200 baud**.
3. Type a homework problem (e.g. `What is 3(x-2)?`) and press Enter.
4. The buddy's hint appears in the monitor.

---

## B – Run the Flask backend

### 1. Install dependencies

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `AI_PROVIDER` | `anthropic` (default) or `openai` |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `ANTHROPIC_MODEL` | Default: `claude-sonnet-4-6` |
| `OPENAI_API_KEY` | Your OpenAI key (only if using OpenAI) |
| `OPENAI_MODEL` | Default: `gpt-4o-mini` |
| `DEEPGRAM_API_KEY` | Your Deepgram key (for voice pipeline) |

### 3. Start the server

```bash
python server.py
```

The server listens on **0.0.0.0:5000**.
Find your machine's LAN IP (`ipconfig` / `ip addr`) and put it in the sketch as `SERVER_HOST`.

### 4. Quick curl test

```bash
curl -X POST http://localhost:5000/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "I need to expand 3(x-2), where do I start?"}'
```

---

## C – End-to-end test

1. Backend running → Serial Monitor open → type a problem → see the hint.
2. The ESP32 POSTs `{"message": "..."}` to `/chat` and prints the `reply` field.

---

## Next steps – adding real voice (I2S mic + speaker)

### Hardware

| Part | Purpose |
|---|---|
| **INMP441** (I2S microphone) | Captures the kid's voice |
| **MAX98357A** (I2S amp + speaker) | Plays back the AI's response |

### Wiring (example pin mapping)

```
INMP441  →  ESP32
  VDD       3.3 V
  GND       GND
  WS        GPIO 25
  SCK       GPIO 26
  SD        GPIO 34  (input)
  L/R       GND (left channel)

MAX98357A  →  ESP32
  VIN        5 V
  GND        GND
  BCLK       GPIO 27
  LRC        GPIO 25   (shared with mic WS if using full-duplex I2S)
  DIN        GPIO 22
```

### Software pipeline

1. **Capture** — read I2S audio from INMP441 into a buffer.
2. **STT** — stream PCM bytes to **Deepgram** WebSocket API; receive transcript.
3. **Chat** — POST transcript to `/chat`; receive guided hint text.
4. **TTS** — stream hint text to **Deepgram** TTS (or ElevenLabs); receive audio.
5. **Playback** — write audio bytes to MAX98357A via I2S.

Deepgram STT endpoint: `wss://api.deepgram.com/v1/listen`
Deepgram TTS endpoint: `wss://api.deepgram.com/v1/speak`

Set `DEEPGRAM_API_KEY` in `.env`; the backend can proxy STT/TTS so the key
never lives on the device.
