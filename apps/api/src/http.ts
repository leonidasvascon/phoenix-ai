import type { ServerResponse } from "node:http";

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  const origin = process.env.PHOENIX_CORS_ORIGIN ?? process.env.PHOENIX_STUDIO_ORIGIN ?? "http://127.0.0.1:3000";
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Phoenix-Api-Key",
    "Access-Control-Allow-Methods": "DELETE,GET,POST,PUT,OPTIONS",
    "Content-Type": "application/json",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
  response.end(JSON.stringify(payload, null, 2));
}
