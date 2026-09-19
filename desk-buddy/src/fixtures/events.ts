import type { LearningEvent, Skill } from "../types/contracts";
export function seedEvents(now = new Date()): LearningEvent[] {
  const skills: Skill[] = ["distributive_property", "one_step_equations", "combining_terms"];
  return Array.from({ length: 18 }, (_, i) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (6 - Math.floor(i / 3)));
    date.setUTCHours(15, i % 3 * 10, 0, 0);
    const independent = i % 3 !== 0;
    return { id: `seed-${i}`, sessionId: `seed-${i}`, completedAt: date.toISOString(), skill: skills[i % 3], independent, hintsUsed: independent ? 0 : 2, incorrectAttempts: independent ? 0 : 1, durationSeconds: 120 + i * 12, source: "seed" };
  });
}
