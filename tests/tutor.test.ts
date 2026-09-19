import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { applyTurn, createSession, isCorrect } from "../src/lib/server/tutor";
import { tutorRequestSchema } from "../src/types/contracts";
import type { TutorRequest } from "../src/types/contracts";
const request = (sessionId: string, action: "hint" | "attempt", answer = ""): TutorRequest => ({ sessionId, requestId: randomUUID(), action, answer });
test("requires an attempt before hints", () => {
  const s = createSession(randomUUID());
  const result = applyTurn(s, request(s.id, "hint"));
  assert.equal(s.hintsUsed, 0); assert.equal(result.response.outcome, "try_again"); assert.equal(result.event, undefined);
});
test("wrong answer, hint, correct answer produces supported completion", () => {
  const s = createSession(randomUUID(), new Date("2026-09-19T12:00:00Z"));
  applyTurn(s, request(s.id, "attempt", "3x-2"));
  const hint = applyTurn(s, request(s.id, "hint"));
  assert.equal(hint.response.hintsUsed, 1); assert.ok(!hint.response.message.includes("3x − 6"));
  const result = applyTurn(s, request(s.id, "attempt", "3x-6"), new Date("2026-09-19T12:02:00Z"));
  assert.equal(result.response.complete, true); assert.equal(result.event?.independent, false);
  assert.equal(result.event?.durationSeconds, 120); assert.equal(result.event?.incorrectAttempts, 1);
});
test("direct correct answer is without hints", () => {
  const s = createSession(randomUUID()); assert.equal(applyTurn(s, request(s.id, "attempt", "3x − 6")).event?.independent, true);
});
test("duplicate request is idempotent and cannot emit a second event", () => {
  const s = createSession(randomUUID()); const r = request(s.id, "attempt", "3x-6");
  const first = applyTurn(s, r); const second = applyTurn(s, r);
  assert.deepEqual(second.response, first.response); assert.equal(second.event, undefined); assert.equal(s.attempts, 1);
  assert.equal(applyTurn(s, request(s.id, "attempt", "3x-6")).event, undefined);
});
test("malformed requests and blank attempts are rejected", () => {
  assert.equal(tutorRequestSchema.safeParse({}).success, false);
  assert.equal(tutorRequestSchema.safeParse(request(randomUUID(), "attempt", " ")).success, false);
  assert.equal(tutorRequestSchema.safeParse(request(randomUUID(), "hint")).success, true);
});
test("checker accepts only documented expanded forms, never evaluates code", () => {
  assert.equal(isCorrect(" -6 + 3*x "), true); assert.equal(isCorrect("3(x-2)"), false);
  assert.equal(isCorrect("process.exit()"), false); assert.equal(isCorrect("3x+6"), false);
});
