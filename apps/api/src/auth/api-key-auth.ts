import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export type AuthResult =
  | { authenticated: true }
  | { authenticated: false; status: 401 | 403 | 500; message: string };

export function authenticateApiKey(request: IncomingMessage): AuthResult {
  const expectedKey = process.env.PHOENIX_API_KEY;

  if (!expectedKey) {
    return {
      authenticated: false,
      status: 500,
      message: "PHOENIX_API_KEY is not configured."
    };
  }

  const providedKey = readApiKey(request);

  if (!providedKey) {
    return {
      authenticated: false,
      status: 401,
      message: "API key is required."
    };
  }

  if (!keysMatch(providedKey, expectedKey)) {
    return {
      authenticated: false,
      status: 403,
      message: "Invalid API key."
    };
  }

  return { authenticated: true };
}

function readApiKey(request: IncomingMessage): string {
  const authorization = request.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  const headerKey = request.headers["x-phoenix-api-key"];

  return Array.isArray(headerKey) ? headerKey[0]?.trim() ?? "" : headerKey?.trim() ?? "";
}

function keysMatch(providedKey: string, expectedKey: string): boolean {
  const provided = Buffer.from(providedKey);
  const expected = Buffer.from(expectedKey);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
