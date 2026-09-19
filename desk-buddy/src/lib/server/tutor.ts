import type { LearningEvent, Session, TutorRequest, TutorResponse } from "../../types/contracts";

export const DEMO_PROBLEM = "Expand 3(x − 2).";
const hints = [
  "Multiply 3 by each term inside the parentheses. What is 3 × x?",
  "Now multiply 3 by −2. Keep the negative sign, then combine the two products."
];
export function createSession(id: string, now = new Date()): Session {
  return { id, startedAt: now.toISOString(), completedAt: null, problem: DEMO_PROBLEM, skill: "distributive_property", hintsUsed: 0, attempts: 0, incorrectAttempts: 0, requests: {} };
}
export function isCorrect(answer: string): boolean {
  return ["3x-6", "3*x-6", "-6+3x", "-6+3*x"].includes(answer.toLowerCase().replace(/\s/g, "").replace(/[−–]/g, "-"));
}
export function applyTurn(session: Session, request: TutorRequest, now = new Date()): { response: TutorResponse; event?: LearningEvent } {
  const cached = session.requests[request.requestId];
  if (cached) return { response: cached };
  let message: string;
  let outcome: TutorResponse["outcome"];
  let event: LearningEvent | undefined;
  if (session.completedAt) {
    message = "You already completed this problem. Start a new practice session when you are ready.";
    outcome = "correct";
  } else if (request.action === "hint") {
    if (session.attempts === 0) {
      message = "Try one step first—even an unfinished attempt is a good start.";
      outcome = "try_again";
    } else {
      message = hints[Math.min(session.hintsUsed, hints.length - 1)];
      session.hintsUsed += 1;
      outcome = "hint";
    }
  } else {
    session.attempts += 1;
    if (isCorrect(request.answer)) {
      outcome = "correct";
      message = "Yes! 3 × x = 3x and 3 × (−2) = −6. You applied the multiplier to both terms. Tell someone why the constant stays negative.";
      session.completedAt = now.toISOString();
      event = { id: session.id, sessionId: session.id, completedAt: session.completedAt, skill: session.skill, independent: session.hintsUsed === 0, hintsUsed: session.hintsUsed, incorrectAttempts: session.incorrectAttempts, durationSeconds: Math.max(0, Math.min(3600, Math.round((now.getTime() - Date.parse(session.startedAt)) / 1000))), source: "demo" };
    } else {
      outcome = "try_again";
      session.incorrectAttempts += 1;
      message = "That is not one of the forms this small demo recognizes yet. Try again, or ask for a hint. Use a form like ax + b; this is not a general algebra checker.";
    }
  }
  const response: TutorResponse = { mode: "demo", sessionId: session.id, message, outcome, hintsUsed: session.hintsUsed, complete: Boolean(session.completedAt) };
  session.requests[request.requestId] = response;
  return { response, event };
}
