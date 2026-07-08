import type { ServerResponse } from "node:http";

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": process.env.PHOENIX_STUDIO_ORIGIN ?? "http://127.0.0.1:3000",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "DELETE,GET,POST,PUT,OPTIONS",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload, null, 2));
}
