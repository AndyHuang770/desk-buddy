import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";
export const metadata: Metadata = { title: "Desk Buddy · Learn a little more", description: "A local, synthetic-data homework companion starter." };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>
    <header className="topbar"><Link className="brand" href="/"><span className="brand-icon" aria-hidden="true">db</span> Desk Buddy<span className="tag">STARTER</span></Link>
      <nav aria-label="Main navigation"><Link href="/learn">Practice</Link><Link href="/parent">Parent view</Link></nav></header>
    <div className="notice">DEMO MODE · Synthetic data only · No AI calls or authentication · Local use only</div>
    <main id="main">{children}</main><footer>Small steps. Real understanding. <span>HackMIT / Andy + Kyle</span></footer>
  </body></html>;
}
