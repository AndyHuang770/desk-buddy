"""
server.py – Desk Buddy Flask backend
POST /chat  { "message": "..." }  →  { "reply": "..." }

Set AI_PROVIDER in .env to "anthropic" (default) or "openai".
The system prompt guides the AI to coach kids without giving away answers.
"""

import os
import struct
import requests as http_requests
from flask import Flask, request, jsonify, Response
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

AI_PROVIDER      = os.getenv("AI_PROVIDER", "anthropic").lower()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")

SYSTEM_PROMPT = (
    "You are Desk Buddy, a friendly homework tutor for kids aged 8-14. "
    "Your job is to GUIDE the student to find the answer themselves – never "
    "just hand over the solution. Ask leading questions, give small hints one "
    "step at a time, and celebrate their progress. Keep responses short "
    "(2-4 sentences) so they are easy to read on a small screen or hear aloud."
)


def get_reply_anthropic(user_message: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    response = client.messages.create(
        model=model,
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text


def get_reply_openai(user_message: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    response = client.chat.completions.create(
        model=model,
        max_tokens=256,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content


# ── Deepgram helpers ──────────────────────────────────────────────────────────

_DG_STT_URL = "https://api.deepgram.com/v1/listen"
_DG_TTS_URL = "https://api.deepgram.com/v1/speak"
_SAMPLE_RATE = 16000


def _make_wav_header(pcm_len: int, sample_rate: int = _SAMPLE_RATE,
                     channels: int = 1, bits: int = 16) -> bytes:
    byte_rate   = sample_rate * channels * bits // 8
    block_align = channels * bits // 8
    return struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + pcm_len, b"WAVE",
        b"fmt ", 16, 1, channels, sample_rate,
        byte_rate, block_align, bits,
        b"data", pcm_len,
    )


def deepgram_stt(pcm_bytes: bytes,
                 sample_rate: int = _SAMPLE_RATE,
                 channels: int = 1,
                 bits: int = 16) -> str:
    """Convert raw PCM bytes to text via Deepgram nova-2."""
    wav = _make_wav_header(len(pcm_bytes), sample_rate, channels, bits) + pcm_bytes
    r = http_requests.post(
        _DG_STT_URL,
        headers={
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/wav",
        },
        params={"model": "nova-2", "smart_format": "true", "language": "en"},
        data=wav,
        timeout=30,
    )
    r.raise_for_status()
    alts = r.json()["results"]["channels"][0]["alternatives"]
    return alts[0]["transcript"] if alts else ""


def deepgram_tts(text: str) -> bytes:
    """Convert text to raw 16-bit 16 kHz mono PCM via Deepgram Aura TTS."""
    r = http_requests.post(
        _DG_TTS_URL,
        headers={
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "application/json",
        },
        params={
            "model":       "aura-asteria-en",
            "encoding":    "linear16",
            "sample_rate": str(_SAMPLE_RATE),
            "channels":    "1",
        },
        json={"text": text},
        timeout=30,
    )
    r.raise_for_status()
    return r.content  # raw PCM bytes


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True, silent=True) or {}
    user_message = (data.get("message") or "").strip()
    if not user_message:
        return jsonify({"error": "message field is required"}), 400

    try:
        if AI_PROVIDER == "openai":
            reply = get_reply_openai(user_message)
        else:
            reply = get_reply_anthropic(user_message)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"reply": reply})


@app.route("/voice", methods=["POST"])
def voice():
    """
    Accept raw 16-bit mono PCM from the ESP32, run the full pipeline:
      PCM → Deepgram STT → AI tutor reply → Deepgram TTS → raw PCM back.

    Optional request headers (ESP32 sets these):
      X-Sample-Rate  (default 16000)
      X-Channels     (default 1)
      X-Bit-Depth    (default 16)
    """
    if not DEEPGRAM_API_KEY:
        return jsonify({"error": "DEEPGRAM_API_KEY not set in .env"}), 500

    pcm_bytes = request.data
    if not pcm_bytes:
        return jsonify({"error": "No audio data received"}), 400

    sample_rate = int(request.headers.get("X-Sample-Rate", _SAMPLE_RATE))
    channels    = int(request.headers.get("X-Channels",    1))
    bits        = int(request.headers.get("X-Bit-Depth",   16))

    try:
        transcript = deepgram_stt(pcm_bytes, sample_rate, channels, bits)
    except Exception as exc:
        return jsonify({"error": f"STT failed: {exc}"}), 500

    if not transcript.strip():
        return jsonify({"error": "No speech detected"}), 422

    print(f"[STT] '{transcript}'")

    try:
        reply = get_reply_openai(transcript) if AI_PROVIDER == "openai" \
                else get_reply_anthropic(transcript)
    except Exception as exc:
        return jsonify({"error": f"LLM failed: {exc}"}), 500

    print(f"[LLM] '{reply}'")

    try:
        audio_bytes = deepgram_tts(reply)
    except Exception as exc:
        return jsonify({"error": f"TTS failed: {exc}"}), 500

    # Return raw PCM; ESP32 writes it directly to I2S
    return Response(audio_bytes, mimetype="audio/l16; rate=16000; channels=1")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
