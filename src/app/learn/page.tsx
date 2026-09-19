"use client";
import { useState } from "react";
import Link from "next/link";
import type { TutorResponse } from "@/types/contracts";
type Message = { role: "buddy" | "you"; text: string };
export default function Learn() {
  const [session, setSession] = useState<{ sessionId: string; problem: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [hints, setHints] = useState(0);
  async function start() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/sessions", { method: "POST" }); const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data); setComplete(false); setHints(0); setAnswer("");
      setMessages([{ role: "buddy", text: "Let’s work through this together. What do you think the expanded expression looks like?" }]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect."); } finally { setBusy(false); }
  }
  async function send(action: "attempt" | "hint") {
    if (!session || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.sessionId, requestId: crypto.randomUUID(), action, answer }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      const result = data as TutorResponse;
      setMessages(previous => [...previous, { role: "you", text: action === "hint" ? "Can I have a hint?" : answer }, { role: "buddy", text: result.message }]);
      setHints(result.hintsUsed); setComplete(result.complete); if (action === "attempt") setAnswer("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect."); } finally { setBusy(false); }
  }
  return <section><div className="page-heading"><div><p className="eyebrow">YOUR THINKING SPACE</p><h1>Let’s figure it out.</h1><p className="muted">One problem. One step at a time.</p></div><span className="pill">Math · Practice demo</span></div>
    <div className="learn-grid"><aside><article className="card problem"><span className="eyebrow">DISTRIBUTIVE PROPERTY</span><h2>{session?.problem ?? "Expand 3(x − 2)."}</h2><p>Write an expanded expression, not a value for x.</p><div className="divider"/><p className="small">Hints used <strong>{hints}</strong></p><p className="small muted">Scripted tutor · typed answers only</p></article><p className="small muted">No real child information, photos, or audio should be entered in this demo.</p></aside>
    <article className="card conversation"><div className="conversation-heading"><span className="buddy-dot" aria-hidden="true"/><h2>Buddy is here to help</h2></div>
      {!session ? <div className="empty"><h3>Ready for a small challenge?</h3><p>You can always ask for a nudge after trying.</p><button onClick={start} disabled={busy}>{busy ? "Starting…" : "Start practice"}</button></div> : <>
        <div className="messages" aria-live="polite" aria-relevant="additions">{messages.map((m, i) => <div key={i} className={`message ${m.role}`}><span>{m.role === "you" ? "YOU" : "BUDDY"}</span><p>{m.text}</p></div>)}</div>
        {complete ? <div className="success"><h3>A little more understood.</h3><p>Your completed practice has been added to the demo dashboard.</p><div className="actions"><Link className="button" href="/parent">See parent view</Link><button className="secondary" onClick={start} disabled={busy}>New session</button></div></div> : <form onSubmit={e => { e.preventDefault(); void send("attempt"); }}><label htmlFor="answer">Your expression or first attempt</label><input id="answer" maxLength={300} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your thinking here…" disabled={busy}/><div className="actions"><button type="submit" disabled={busy || !answer.trim()}>{busy ? "Thinking…" : "Check my attempt"}</button><button type="button" className="secondary" disabled={busy} onClick={() => void send("hint")}>Give me a hint</button></div></form>}
      </>}{error && <p className="error" role="alert">{error}</p>}
    </article></div></section>;
}
