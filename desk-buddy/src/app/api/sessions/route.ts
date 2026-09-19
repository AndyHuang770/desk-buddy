import { randomUUID } from "node:crypto";
import { transaction } from "@/lib/server/store";
import { createSession } from "@/lib/server/tutor";
import { checkOrigin, errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!checkOrigin(request)) return errorResponse("Cross-origin requests are not allowed.", 403);
  try {
    const session = await transaction(store => {
      // Bound session history in this single-user demonstration.
      if (Object.keys(store.sessions).length >= 100) delete store.sessions[Object.keys(store.sessions)[0]];
      const s = createSession(randomUUID()); store.sessions[s.id] = s; return s;
    });
    return Response.json({ mode: "demo", sessionId: session.id, problem: session.problem }, { status: 201 });
  } catch { return errorResponse("Could not start a session. Check local disk access.", 500); }
}
