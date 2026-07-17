import type { IncomingMessage } from "node:http";
import { ApiError } from "./errors/api-error.ts";

type RateLimitState = {
  count: number;
  resetAt: number;
};

const clients = new Map<string, RateLimitState>();

export function enforceRateLimit(request: IncomingMessage): void {
  if ((process.env.PHOENIX_RATE_LIMIT_ENABLED ?? "true") === "false") {
    return;
  }

  const windowMs = Number(process.env.PHOENIX_RATE_LIMIT_WINDOW_MS ?? 60000);
  const maxRequests = Number(process.env.PHOENIX_RATE_LIMIT_MAX ?? 120);
  const now = Date.now();
  const clientId = String(request.headers["x-forwarded-for"] ?? request.socket.remoteAddress ?? "local");
  const state = clients.get(clientId);

  if (!state || state.resetAt <= now) {
    clients.set(clientId, { count: 1, resetAt: now + windowMs });
    return;
  }

  state.count += 1;
  if (state.count > maxRequests) {
    throw new ApiError("RATE_LIMITED", "Rate limit exceeded.", 429);
  }
}
