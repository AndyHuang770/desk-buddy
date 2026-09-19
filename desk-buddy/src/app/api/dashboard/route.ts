import { transaction } from "@/lib/server/store";
import { summarize } from "@/lib/server/analytics";
import { seedEvents } from "@/fixtures/events";
import { errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const events = await transaction(store => store.events);
    return Response.json(summarize([...seedEvents(), ...events]), { headers: { "Cache-Control": "no-store" } });
  } catch { return errorResponse("Could not load local demo history.", 500); }
}
