import Link from "next/link";
export default function Home() {
  return <section className="home"><p className="eyebrow">A LITTLE HELP. A LOT OF DISCOVERY.</p>
    <h1>Not just the answer.<br/><em>The “I get it” moment.</em></h1>
    <p className="lead">A homework companion that makes room for thinking—and helps parents see where a little encouragement matters most.</p>
    <div className="actions"><Link className="button" href="/learn">Try a practice session <span aria-hidden="true">↗</span></Link><Link className="button secondary" href="/parent">Explore parent view</Link></div>
    <div className="home-grid"><article className="card"><p className="step">01 / TRY</p><h2>Start with your thinking.</h2><p>Make an attempt. It does not need to be perfect.</p></article>
    <article className="card"><p className="step">02 / DISCOVER</p><h2>A nudge, not a shortcut.</h2><p>Use a small hint to find your next step.</p></article>
    <article className="card"><p className="step">03 / REFLECT</p><h2>See what is growing.</h2><p>Turn practice into useful conversations at home.</p></article></div>
    <p className="small muted">This starter uses one scripted algebra problem. Live AI, private family accounts, and cloud storage are intentionally not connected yet.</p>
  </section>;
}
