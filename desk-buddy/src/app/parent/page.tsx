"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardResponse } from "@/types/contracts";
const dateLabel = (date: string) => new Date(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
export default function Parent() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try { const res = await fetch("/api/dashboard", { cache: "no-store" }); const result = await res.json(); if (!res.ok) throw new Error(result.error); setData(result); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load dashboard."); } finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 10000); return () => clearInterval(timer); }, [load]);
  return <section><div className="page-heading"><div><p className="eyebrow">THE BIG PICTURE / DEMO LEARNER</p><h1>A little progress, every day.</h1><p className="muted">A window into practice. A starting point for encouragement.</p></div><button className="secondary" disabled={busy} onClick={() => void load()}>{busy ? "Refreshing…" : "Refresh data"}</button></div>
    {error && <p className="error" role="alert">{error} <button onClick={() => void load()}>Retry</button></p>}
    {!data ? <div className="card" role="status">{error ? "Waiting for a successful connection." : "Loading demo learning history…"}</div> : <>
      <div className="metrics">{[["Practice minutes", data.summary.practiceMinutes, "Elapsed time; not measured attention"], ["Problems completed", data.summary.completedProblems, "This 7-day UTC window"], ["Without hints", `${data.summary.independentSolveRate}%`, "Share of completed problems"], ["Topics practiced", data.summary.topicsPracticed, "From recorded sessions"]].map(([label, value, caption]) => <article className="card metric" key={label}><p>{label}</p><strong>{value}</strong><span>{caption}</span></article>)}</div>
      <div className="dashboard-grid"><article className="card"><div className="section-heading"><h2>Room to grow</h2><span className="pill">By topic</span></div><p className="small muted">Based on observed hint use—not a mastery or diagnostic score.</p>
        {data.skills.map(skill => <div className="skill" key={skill.skill}><div className="skill-title"><h3>{skill.label}</h3><span className={`status ${skill.status}`}>{skill.status.replaceAll("_", " ")}</span></div><div className="meter" role="meter" aria-label={`${skill.label}: completed without hints`} aria-valuenow={skill.independentRate} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${skill.independentRate}%` }}/></div><p className="small muted">{skill.independentRate}% without hints · {skill.evidenceCount} completed problems</p></div>)}
      </article><article className="card"><div className="section-heading"><h2>A week of practice</h2><span className="pill">Minutes</span></div><div className="activity" role="img" aria-label={data.activity.map(d => `${d.date}: ${d.minutes} minutes`).join("; ")}>{data.activity.map(day => <div className="activity-column" key={day.date}><span className="small">{day.minutes}</span><div className="bar-track"><div className="bar" style={{ height: `${Math.max(2, day.minutes / Math.max(1, ...data.activity.map(d => d.minutes)) * 100)}%` }}/></div><span className="small muted">{dateLabel(day.date)}</span></div>)}</div><p className="small muted">Includes labeled sample history and your completed demo sessions.</p></article></div>
      <article className="nudge"><span className="eyebrow">A CONVERSATION TO TRY</span><h2>“Can you teach me that step?”</h2><p>{data.skills.find(s => s.status === "needs_practice")?.suggestion ?? "Ask your learner to explain one problem they enjoyed working through."}</p></article>
      <article className="card"><div className="section-heading"><h2>Recent practice</h2><Link href="/learn">Try the student experience ↗</Link></div><div className="table-wrap"><table><thead><tr><th>Topic</th><th>Outcome</th><th>Minutes</th><th>Source</th></tr></thead><tbody>{data.recentSessions.map(s => <tr key={s.id}><td>{s.skill}</td><td>{s.summary}</td><td>{s.durationMinutes}</td><td><span className="pill">{s.source === "seed" ? "Sample history" : "Your demo"}</span></td></tr>)}</tbody></table></div></article>
      <p className="small muted">Refreshes every 10 seconds. Last fetched: {new Date(data.generatedAt).toLocaleTimeString()}. No family accounts or privacy controls are implemented yet.</p>
    </>}</section>;
}
