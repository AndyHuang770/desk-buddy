import { z } from "zod";

export const skillSchema = z.enum(["distributive_property", "one_step_equations", "combining_terms"]);
export type Skill = z.infer<typeof skillSchema>;
export const tutorRequestSchema = z.object({
  sessionId: z.string().uuid(),
  requestId: z.string().uuid(),
  action: z.enum(["attempt", "hint"]),
  answer: z.string().trim().max(300).default("")
}).strict().refine(v => v.action !== "attempt" || v.answer.length > 0, { message: "Enter an answer first." });
export type TutorRequest = z.infer<typeof tutorRequestSchema>;
export interface TutorResponse {
  mode: "demo";
  sessionId: string;
  message: string;
  outcome: "try_again" | "hint" | "correct";
  hintsUsed: number;
  complete: boolean;
}
export interface Session {
  id: string; startedAt: string; completedAt: string | null;
  problem: string; skill: Skill; hintsUsed: number; attempts: number;
  incorrectAttempts: number;
  requests: Record<string, TutorResponse>;
}
export interface LearningEvent {
  id: string; sessionId: string; completedAt: string; skill: Skill;
  independent: boolean; hintsUsed: number; incorrectAttempts: number;
  durationSeconds: number; source: "seed" | "demo";
}
export interface DashboardResponse {
  mode: "demo";
  generatedAt: string;
  summary: { practiceMinutes: number; completedProblems: number; independentSolveRate: number; topicsPracticed: number };
  activity: Array<{ date: string; minutes: number; attempts: number }>;
  skills: Array<{ skill: Skill; label: string; status: "needs_practice" | "practicing" | "insufficient_evidence"; evidenceCount: number; independentRate: number; suggestion: string }>;
  recentSessions: Array<{ id: string; skill: string; startedAt: string; durationMinutes: number; summary: string; source: "seed" | "demo" }>;
}
