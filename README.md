# Desk Buddy

A Next.js + React + TypeScript starter for Andy and Kyle's HackMIT project. It runs locally **without API keys**. This is a mock-mode engineering starter, not a production service or general-purpose AI tutor.

## Quick start

Requires **Node.js 22+** ([nodejs.org](https://nodejs.org/)). With nvm, `nvm use` reads `.nvmrc`.

```bash
git clone https://github.com/AndyHuang770/desk-buddy.git
cd desk-buddy
cp .env.example .env.local   # optional; placeholders only
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Stop with Control-C. The server binds to localhost only.

## Project layout

```
src/app/           Pages and API route handlers
src/components/    Shared UI (owned by Kyle as the UI grows)
src/lib/server/    Tutor state machine, store, analytics
src/types/         Shared API contracts
src/fixtures/      Synthetic seed events
docs/              API contract, handoff tickets, verification notes
tests/             Unit tests for tutor + analytics
scripts/smoke.mjs  HTTP smoke check against a running server
```

## What works in demo mode

- Landing page, `/learn` student practice, `/parent` parent dashboard
- Deterministic tutor for **Expand 3(x − 2)** — try `3x-2`, ask for a hint, then submit `3x-6`
- Hints require a first attempt; no AI provider is called
- Completions write one event; duplicate request IDs cannot double-count
- Parent metrics mix labeled synthetic history with your demo completions
- Local JSON storage under `.data/demo.json` (gitignored)
- Typecheck, unit tests, production build, and HTTP smoke script

## What is not implemented

Live AI, Elastic, Supabase, authentication, parent/child linking, photo/voice, PWA, and production deployment. Empty env vars are placeholders. **Do not expose this starter publicly or enter real children's information.**

## Verify

```bash
npm run typecheck
npm test
npm run build
```

With the server running:

```bash
npm run smoke
```

## Team boundaries

| Owner | Main files | Next task |
| --- | --- | --- |
| Andy | `src/app/api`, `src/lib/server`, `src/types`, `tests`, deps/env | Replace mock tutor/storage with authenticated live integrations |
| Kyle | `src/app/learn`, `src/app/parent`, `src/components`, `src/styles`, `public` | Improve interaction design and dashboard UX against the shared contract |
| Both | `docs/API.md`, integration testing | Keep API shapes stable; agree on changes before shipping |

## Docs

- [`docs/API.md`](docs/API.md) — requests, responses, errors
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — scoped work tickets
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — packaging verification notes

## Before live deployment

See the checklist in the original packaging notes: auth + ownership checks, Supabase (or equivalent) with RLS, server-side AI adapter with leakage tests, Elastic behind durable storage, family isolation tests, and retention/deletion controls. This starter is not ready for public or serverless persistence as-is.

No open-source license has been selected yet; choose one before publishing.
