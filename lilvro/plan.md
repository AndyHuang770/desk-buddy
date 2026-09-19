# lilvro — Plan

## Vision

An AI voice companion for STEM learning, designed to make mathematical and scientific knowledge **orally accessible**. Instead of copying LLM-generated answers, students are walked through problems via natural conversation with an agent that speaks math like a human does.

> `sqrt(x)` -> "square root of x" | `dy/dx` -> "the derivative of y with respect to x" | `[[1,2],[3,4]]` -> "a 2 by 2 matrix with top row 1 and 2, bottom row 3 and 4"

---

## Target

- **Who**: Kids, primarily younger students (roughly 8-14)
- **Subject**: STEM — math, science, engineering concepts
- **Niche**: Scientific communication via speech — the agent speaks and understands math notation naturally

---

## Core Philosophy

- Kids should **study with the agent**, not copy from it
- The agent acts as a **peer**, not a tutor — less intimidating, more conversational
- **No screen. No UI.** Purely voice in, voice out — the interface is the conversation itself
- No distraction: designed eventually for a dedicated ESP32 device; for now runs on a phone (mic + speaker only)

---

## Key Modes

### 1. Voice STEM Agent (Core)
- Fully voice-driven: student speaks, agent speaks back — no screen, no typing
- Student can state a problem verbally: "what is the integral of x squared from 0 to 1?"
- Agent interprets spoken math and responds in natural spoken math
- Handles: arithmetic, algebra, square roots, exponents, calculus (derivatives, integrals, limits), matrices, scientific notation, units
- Built on **Deepgram** (STT) + **Claude** (reasoning + pedagogy) + TTS

### 2. Teach-Back Mode
- Student explains a concept to the agent
- Agent listens, then asks concept-check questions
- Agent can intentionally misunderstand a poorly explained concept to push the student to be more precise
- Tracks strong vs. weak areas over time

### 3. Mistake Mode
- Agent deliberately explains something incorrectly
- Student must identify and correct the error
- Builds critical thinking and deeper understanding

### 4. Study / Problem Walkthrough Mode
- Student brings a problem; agent walks them through it step by step
- Never gives the final answer directly — guides via Socratic questioning
- Tracks which steps the student needed help on

---

## Dashboard

| Component | Description |
|---|---|
| **Motivation** | Streaks, encouragement, session goals |
| **Progression** | Topics covered, skills unlocked |
| **Mastery / Understanding** | Per-topic confidence scores from Teach-Back and walkthroughs |
| **Activity** | Time spent, attention span %, session history |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Speech-to-Text | Deepgram (Codex $50 credit) |
| LLM / Reasoning | Claude API (claude-sonnet-4-6) |
| Text-to-Speech | Deepgram Aura or ElevenLabs |
| Math parsing | Custom notation-to-speech layer |
| Phone app (v1) | React Native or Flutter |
| Hardware target (v2) | ESP32 |

---

## Math-to-Speech Layer (Key Differentiator)

This is the core technical challenge. Since there is no screen, all math must flow through speech in both directions:

- **STT -> structured math**: Deepgram transcribes student speech; a normalizer maps spoken phrases ("square root of x", "x to the power of 2") into structured math representations for Claude to reason over
- **Structured math -> TTS**: Claude's response is passed through a math-to-speech renderer before being sent to TTS, so the agent never says "sqrt x" or "x caret 2" aloud

Examples to handle:

| Expression | Spoken form |
|---|---|
| `x^2` | "x squared" |
| `x^n` | "x to the power of n" |
| `sqrt(x)` | "square root of x" |
| `cbrt(x)` | "cube root of x" |
| `dy/dx` | "the derivative of y with respect to x" |
| `d^2y/dx^2` | "the second derivative of y with respect to x" |
| `int_a^b f(x) dx` | "the integral from a to b of f of x" |
| `lim_{x->0}` | "the limit as x approaches 0" |
| `[[1,2],[3,4]]` | "a 2 by 2 matrix, top row 1 and 2, bottom row 3 and 4" |
| `6.02e23` | "6 point 0 2 times 10 to the 23" |

---

## Build Phases

### Phase 1 — MVP (Hackathon)
- [ ] Math-to-speech renderer (structured math -> natural English for TTS)
- [ ] Speech-to-math normalizer (spoken phrases -> structured math for Claude)
- [ ] Voice loop: Deepgram STT -> normalizer -> Claude -> math renderer -> TTS
- [ ] Basic problem walkthrough mode (Socratic, voice only)
- [ ] Minimal phone app: just a mic button, no display of content

### Phase 2 — Core Modes
- [ ] Teach-Back mode with concept-check questions
- [ ] Mistake Mode
- [ ] Mastery tracking per topic

### Phase 3 — Dashboard + Polish
- [ ] Student dashboard (progression, mastery, activity)
- [ ] Social/peer persona tuning
- [ ] Attention span tracking

### Phase 4 — Hardware
- [ ] Port to ESP32
- [ ] Offline-capable fallback for basic interactions

---

## Open Questions
- Do we need user accounts / persistence for the hackathon, or is session-only fine?
- What is the peer persona's name/character? (Affects engagement for kids)
- How does a student signal which mode they want (walkthrough vs. teach-back vs. mistake mode) — via a wake phrase, or does the agent infer from context?
