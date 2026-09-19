export function errorResponse(message: string, status: number) { return Response.json({ error: message }, { status }); }
export function checkOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
