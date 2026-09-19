# Desk Buddy — initial software setup

A Next.js + React + TypeScript starter for Andy and Kyle's HackMIT project. It runs locally without API keys. This is a **mock-mode engineering starter**, not a production service or general-purpose AI tutor.

## Start on your Mac

1. Unzip `desk-buddy.zip` onto your Desktop. This creates a `desk-buddy` directory. If that directory already exists, unzip elsewhere first; do not overwrite your current repo.
2. Install Node.js 22 or newer if needed (https://nodejs.org/). Check `node --version` in Warp or Terminal.
3. Run:

```bash
cd "$HOME/Desktop/desk-buddy"
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Stop the server with Control-C. The server intentionally binds to localhost; your phone cannot access it yet. A live deployment will require the production work listed below.

If you use nvm, `nvm use` reads `.nvmrc`. `npm ci` installs the exact tested lockfile. Network access is required for installation, but not for running the demo afterward.

## Included and working

- Landing page, `/learn` student practice, `/parent` responsive parent dashboard.
- A deterministic tutor for **Expand 3(x − 2)**. Try `3x-2`, request a hint, then submit `3x-6`.
- Hints require a first attempt. No AI provider is called and no API credits are consumed.
- A completed problem creates one event. Repeated request IDs and already-completed sessions cannot double-count completion.
- Parent metrics combine 18 **explicitly labeled synthetic history events** with your completed demos. The page refreshes every 10 seconds.
- Shared TypeScript contracts and Zod request validation.
- Local JSON storage under `.data/demo.json`, ignored by Git. Survives local server restarts; does not offer multi-process safety, account separation, or cloud persistence.
- Unit tests, type checking, production build command, and an HTTP smoke test.
- Example environment file, handoff plan, and API documentation.

## What is NOT implemented

Live AI, Elastic, Supabase, authentication, parent/child linking, photo upload, voice, settings, a PWA/offline installer, native mobile apps, and production deployment. Empty environment variables are placeholders, not functioning integrations. No service SDKs are installed yet. CSS-based charts avoid extra dependencies; Kyle can add Tailwind/shadcn/Recharts later if useful.

**Do not expose this starter publicly or enter real children's information.** Anyone who can reach the local server can access all demo records. The origin check is not authentication. Practice answers are not retained in the event store, but scripted responses/session metadata are. No consent or deletion workflow is implemented.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

With a server running in another terminal:

```bash
npm run smoke
```

The smoke test adds one synthetic completion. For a fresh history, stop the server and move `.data/demo.json` to a backup location; it will be recreated. No destructive reset script is included.

## Team boundaries

| Owner | Main files | Next task |
| --- | --- | --- |
| Andy | `src/app/api`, `src/lib/server`, `src/types`, `tests`, environment and dependencies | Replace mock tutor/storage with authenticated live integrations |
| Kyle | `src/app/learn`, `src/app/parent`, `src/components`, `src/styles`, `public` | Improve interaction design and dashboard UX against the shared contract |
| Both | `docs/API.md`, integration testing | Keep API shapes stable; agree on changes before implementation |

There is no Git remote configured and no GitHub repository was changed. After gaining access, copy these files onto a feature branch in the actual repo, preserving existing work. If the repo is empty, this directory can become its initial project. Do not blindly replace an existing package.json or lockfile.

## Architecture

The student page POSTs to `/api/sessions`, then `/api/tutor`. The server applies a scripted state machine and writes a completion event. `/api/dashboard` aggregates those events with seed history. The parent page reads that API. `src/types/contracts.ts` is the shared boundary.

Percentages are 0–100, not 0–1. "Without hints" means a completed problem used zero explicit hints; it does not establish mastery or detect copying. Practice time is elapsed wall-clock duration capped at one hour, not observed attention. The week uses UTC. A topic is flagged "needs practice" only with at least three completions and under 60% without hints; that threshold is a **demo heuristic**, not a validated educational measure. Misconceptions are not automatically diagnosed.

The checker is an allowlist, not a symbolic math parser. It recognizes `3x-6`, `3*x-6`, `-6+3x`, and `-6+3*x`, ignoring whitespace and supporting the Unicode minus sign. Other mathematically equivalent forms may be rejected with an explicit limitation message.

## Before live deployment

1. Add authentication and explicit parent/student ownership checks to every API.
2. Move local JSON state to Supabase Postgres with tested row-level security policies. Use a unique session/event ID for idempotency.
3. Implement the AI adapter server-side with validated outputs, bounded inputs, timeouts, rate limits, and tests for answer leakage. API usage requires separate provider credentials/billing; coding-tool credits should not be assumed to cover it.
4. Add an Elastic event adapter behind the database. Use retryable indexing with unique IDs; don't lose a learner's result if Elastic is unavailable. Apply family scope on every search; pseudonymous IDs are not anonymous data.
5. Replace the seeded dashboard with verified real queries, or keep demo and real accounts explicitly separate.
6. Add private storage and retention/deletion controls before any media capture; review child privacy and provider policies before real users.
7. Test access denial between two families, malformed input, duplicate submissions, upstream failure, and offline/reconnect states.
8. Deploy only after removing the local-file store and adding authorization. This starter is not ready for Vercel/serverless persistence as-is.

## Documentation

- `docs/API.md`: requests, responses, error behavior.
- `docs/HANDOFF.md`: scoped work tickets and integration checkpoints.
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Next.js route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route

No license for redistribution has been selected; the team should choose one before publishing as open source.
