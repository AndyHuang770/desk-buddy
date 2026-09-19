// Run against a local `npm run dev` or `npm start`. Uses only synthetic data.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
async function post(route, body) { return fetch(base + route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
const health = await fetch(base + "/api/health"); assert.equal(health.status, 200);
for (const path of ["/", "/learn", "/parent"]) assert.equal((await fetch(base + path)).status, 200);
const before = await (await fetch(base + "/api/dashboard")).json();
const sessionResponse = await post("/api/sessions", {}); assert.equal(sessionResponse.status, 201);
const { sessionId } = await sessionResponse.json();
const turn = (action, answer = "") => ({ sessionId, requestId: randomUUID(), action, answer });
let result = await (await post("/api/tutor", turn("hint"))).json(); assert.equal(result.hintsUsed, 0);
result = await (await post("/api/tutor", turn("attempt", "3x-2"))).json(); assert.equal(result.complete, false);
result = await (await post("/api/tutor", turn("hint"))).json(); assert.equal(result.hintsUsed, 1);
const correct = turn("attempt", "3x-6");
result = await (await post("/api/tutor", correct)).json(); assert.equal(result.complete, true);
await post("/api/tutor", correct);
const after = await (await fetch(base + "/api/dashboard")).json();
assert.equal(after.summary.completedProblems, before.summary.completedProblems + 1);
assert.equal((await post("/api/tutor", {})).status, 400);
assert.equal((await post("/api/tutor", { ...correct, sessionId: randomUUID(), requestId: randomUUID() })).status, 404);
assert.equal((await fetch(base + "/api/sessions", { method: "POST", headers: { Origin: "https://unrelated.example" } })).status, 403);
console.log("Smoke test passed: pages, API validation, hint policy, persisted event, dashboard update, duplicate handling, and origin check.");
