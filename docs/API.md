# API contract v0 — mock mode only

All endpoints serve the shared localhost demonstration. There is no authentication. Do not use real learner data. TypeScript definitions in `src/types/contracts.ts` are authoritative. Runtime Zod validation applies to tutor requests.

## POST /api/sessions

No body required. Returns HTTP 201:

```json
{ "mode": "demo", "sessionId": "generated-uuid", "problem": "Expand 3(x − 2)." }
```

Only one fixed problem is supported. At most 100 sessions are retained; oldest sessions expire when new sessions are created.

## POST /api/tutor

```json
{ "sessionId": "uuid-from-session", "requestId": "new-uuid-per-action", "action": "attempt", "answer": "3x-2" }
```

Actions: `attempt` or `hint`. Attempts require 1–300 trimmed characters. For hints omit `answer` or send an empty string. Reuse the same requestId when retrying the SAME action. Do not reuse it for a different answer. Completed sessions never create another event. Maximum 100 distinct requests per session.

```json
{
  "mode": "demo", "sessionId": "uuid-from-session",
  "message": "Multiply 3 by each term inside the parentheses. What is 3 × x?",
  "outcome": "hint", "hintsUsed": 1, "complete": false
}
```

HTTP errors: 400 invalid JSON/schema; 403 mismatched Origin; 404 missing session; 413 body over 4,000 characters; 429 per-session turn limit; 500 local storage failure. Errors have `{ "error": "message" }`. The small local demo reads the body before checking its size; add streaming/proxy limits for public use.

## GET /api/dashboard

Returns `DashboardResponse`, generated dynamically with `Cache-Control: no-store`. Includes `mode`, `generatedAt`, `summary`, `activity`, `skills`, `recentSessions`. Counts only completed problems in the last seven UTC calendar dates. Unique event IDs prevent duplicate counts. An empty set returns 0 percentages and `insufficient_evidence`, not a weakness. Recent sessions retain explicit `seed`/`demo` source labels.

## GET /api/health

Returns `{ "ok": true, "mode": "demo", "integrations": { "ai": false, "supabase": false, "elastic": false } }`.

## Future cloud contract

Keep these response types stable when replacing server adapters. Resolve the child/family from an authenticated, authorized session on the server. Never rely on a browser-provided child ID as authorization. Add typed API errors if more detail is needed; agree on changes with Kyle before switching fixtures or UI code.
