import { test } from "node:test";
import assert from "node:assert/strict";
import { seedEvents } from "../src/fixtures/events";
import { summarize } from "../src/lib/server/analytics";
const now = new Date("2026-09-19T18:00:00Z");
test("seed fixtures produce internally consistent dashboard metrics", () => {
  const d = summarize(seedEvents(now), now);
  assert.equal(d.summary.completedProblems, 18); assert.equal(d.summary.independentSolveRate, 67);
  assert.equal(d.summary.topicsPracticed, 3); assert.equal(d.skills[0].status, "needs_practice");
  assert.equal(d.activity.reduce((n, day) => n + day.attempts, 0), 18);
});
test("duplicate events do not inflate counts", () => {
  const e = seedEvents(now); assert.equal(summarize([...e, e[0]], now).summary.completedProblems, 18);
});
test("no evidence does not become a weakness or NaN score", () => {
  const d = summarize([], now); assert.equal(d.summary.independentSolveRate, 0);
  assert.ok(d.skills.every(s => s.status === "insufficient_evidence"));
});
test("old events are excluded from the UTC week", () => {
  const e = seedEvents(now)[0]; e.completedAt = "2020-01-01T00:00:00Z";
  assert.equal(summarize([e], now).summary.completedProblems, 0);
});
