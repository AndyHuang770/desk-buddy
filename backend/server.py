"""
server.py – Desk Buddy Flask backend
POST /chat  { "message": "..." }  →  { "reply": "..." }

Set AI_PROVIDER in .env to "anthropic" (default) or "openai".
The system prompt guides the AI to coach kids without giving away answers.
"""

import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

AI_PROVIDER = os.getenv("AI_PROVIDER", "anthropic").lower()

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
