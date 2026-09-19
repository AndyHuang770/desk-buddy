import type { DashboardResponse, LearningEvent, Skill } from "../../types/contracts";
export const labels: Record<Skill, string> = { distributive_property: "Distributive property", one_step_equations: "One-step equations", combining_terms: "Combining like terms" };
export function summarize(events: LearningEvent[], now = new Date()): DashboardResponse {
  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() - 6 + i); return d.toISOString().slice(0, 10); });
  const unique = [...new Map(events.map(e => [e.id, e])).values()].filter(e => dates.includes(e.completedAt.slice(0, 10)));
  const percent = (items: LearningEvent[]) => items.length ? Math.round(items.filter(e => e.independent).length / items.length * 100) : 0;
  return {
    mode: "demo", generatedAt: now.toISOString(),
    summary: { practiceMinutes: Math.round(unique.reduce((n, e) => n + e.durationSeconds, 0) / 60), completedProblems: unique.length, independentSolveRate: percent(unique), topicsPracticed: new Set(unique.map(e => e.skill)).size },
    activity: dates.map(date => { const day = unique.filter(e => e.completedAt.startsWith(date)); return { date, minutes: Math.round(day.reduce((n, e) => n + e.durationSeconds, 0) / 60), attempts: day.length }; }),
    skills: (Object.keys(labels) as Skill[]).map(skill => {
      const items = unique.filter(e => e.skill === skill);
      const rate = percent(items);
      return { skill, label: labels[skill], status: items.length < 3 ? "insufficient_evidence" : rate < 60 ? "needs_practice" : "practicing", evidenceCount: items.length, independentRate: rate, suggestion: skill === "distributive_property" ? "Ask: why does the multiplier apply to every term? Try 2(x − 3) together." : "Try a fresh problem without hints, then ask for an explanation." };
    }),
    recentSessions: unique.sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 8).map(e => ({ id: e.id, skill: labels[e.skill], startedAt: new Date(Date.parse(e.completedAt) - e.durationSeconds * 1000).toISOString(), durationMinutes: Math.round(e.durationSeconds / 60), summary: e.independent ? "Completed without hints" : `Completed with ${e.hintsUsed} hint(s)`, source: e.source }))
  };
}
