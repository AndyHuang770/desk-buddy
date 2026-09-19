export function GET() { return Response.json({ ok: true, mode: "demo", integrations: { ai: false, supabase: false, elastic: false } }); }
