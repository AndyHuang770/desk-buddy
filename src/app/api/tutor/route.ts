import { tutorRequestSchema } from "@/types/contracts";
import { transaction } from "@/lib/server/store";
import { applyTurn } from "@/lib/server/tutor";
import { checkOrigin, errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!checkOrigin(request)) return errorResponse("Cross-origin requests are not allowed.", 403);
  const text = await request.text();
  if (text.length > 4000) return errorResponse("Request too large.", 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return errorResponse("Invalid JSON.", 400); }
  const parsed = tutorRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Provide a sessionId, requestId, action, and nonempty answer for attempts.", 400);
  try {
    const result = await transaction(store => {
      const session = store.sessions[parsed.data.sessionId];
      if (!session) return { error: "Session not found. Start a new one.", status: 404 };
      if (!session.requests[parsed.data.requestId] && Object.keys(session.requests).length >= 100) return { error: "Session turn limit reached.", status: 429 };
      const turn = applyTurn(session, parsed.data);
      if (turn.event && !store.events.some(e => e.id === turn.event!.id)) {
        store.events.push(turn.event); store.events = store.events.slice(-500);
      }
      return turn.response;
    });
    if ("error" in result) return errorResponse(result.error, result.status);
    return Response.json(result);
  } catch { return errorResponse("Could not save your turn. Please retry.", 500); }
}
