import type { ServerResponse } from "node:http";
import { createTraceId, getTraceId } from "@phoenix-ai/observability";
import { ApiError } from "./api-error.ts";

export function errorPayload(error: unknown) {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Internal server error.", 500);

  return {
    error: {
      code: apiError.code,
      message: apiError.message,
      status: apiError.status,
      trace_id: getTraceId() ?? createTraceId()
    }
  };
}

export function sendApiError(response: ServerResponse, error: unknown): void {
  const payload = errorPayload(error);
  const origin = process.env.PHOENIX_CORS_ORIGIN ?? process.env.PHOENIX_STUDIO_ORIGIN ?? "http://127.0.0.1:3000";
  response.writeHead(payload.error.status, {
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

