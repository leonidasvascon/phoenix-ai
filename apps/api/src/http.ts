import type { ServerResponse } from "node:http";

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown, extraHeaders: Record<string, string | string[]> = {}): void {
  const origin = process.env.PHOENIX_CORS_ORIGIN ?? process.env.PHOENIX_STUDIO_ORIGIN ?? "http://127.0.0.1:3000";
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Phoenix-Api-Key, X-Phoenix-Workspace-Id",
    "Access-Control-Allow-Methods": "DELETE,GET,PATCH,POST,PUT,OPTIONS",
    "Content-Type": "application/json",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload, null, 2));
}
