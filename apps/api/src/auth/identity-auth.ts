import type { IncomingMessage } from "node:http";
import { getCurrentUser, sessionCookieName } from "@phoenix-ai/identity";
import { authenticateApiKey } from "./api-key-auth.ts";

export type ApiAuthResult =
  | { authenticated: true; kind: "service" }
  | { authenticated: true; kind: "user"; userId: string; sessionId: string }
  | { authenticated: false; status: 401 | 403; message: string };

export async function authenticateRequest(request: IncomingMessage): Promise<ApiAuthResult> {
  const sessionId = readSessionId(request);
  if (sessionId) {
    const current = await getCurrentUser(sessionId);
    if (current) {
      return {
        authenticated: true,
        kind: "user",
        userId: current.user.id,
        sessionId: current.session.id
      };
    }
  }

  const apiKey = authenticateApiKey(request);
  if (apiKey.authenticated) return { authenticated: true, kind: "service" };
  return apiKey;
}

export function readSessionId(request: IncomingMessage): string {
  const cookieHeader = request.headers.cookie ?? "";
  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const prefix = `${sessionCookieName()}=`;
  const cookie = cookies.find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

export function headersWithAuthenticatedUser(headers: IncomingMessage["headers"], userId?: string): IncomingMessage["headers"] {
  if (!userId) return headers;
  return {
    ...headers,
    "x-phoenix-user-id": userId
  };
}
