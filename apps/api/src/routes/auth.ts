import type { IncomingMessage, ServerResponse } from "node:http";
import { eventBus } from "@phoenix-ai/event-bus";
import {
  changePassword,
  completeOidcLogin,
  getCurrentUser,
  listOidcProviders,
  listSessions,
  logoutSession,
  loginLocalUser,
  requestPasswordReset,
  revokeUserSession,
  startOidcLogin
} from "@phoenix-ai/identity";
import { readSessionId } from "../auth/identity-auth.ts";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";

export async function handleAuthRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  if (pathname === "/auth/login" && request.method === "POST") {
    const result = await loginLocalUser(await readJsonBody(request), {
      ip: request.socket.remoteAddress,
      userAgent: request.headers["user-agent"]
    });
    await eventBus.publish({
      type: "identity.login",
      origin: "auth-route",
      payload: { user_id: result.user.id, email: result.user.email }
    });
    sendJson(response, 200, { user: result.user, session: sanitizeSession(result.session) }, { "Set-Cookie": result.setCookie });
    return;
  }

  if (pathname === "/auth/register" && request.method === "POST") {
    const identity = await import("@phoenix-ai/identity");
    sendJson(response, 201, await identity.registerLocalUser(await readJsonBody(request)));
    return;
  }

  if (pathname === "/auth/logout" && request.method === "POST") {
    const sessionId = readSessionId(request);
    const result = sessionId ? await logoutSession(sessionId) : { setCookie: "" };
    sendJson(response, 200, { status: "ok" }, result.setCookie ? { "Set-Cookie": result.setCookie } : {});
    return;
  }

  if (pathname === "/auth/me" && request.method === "GET") {
    const sessionId = readSessionId(request);
    const current = sessionId ? await getCurrentUser(sessionId) : null;
    if (!current) {
      sendJson(response, 401, { error: { code: "UNAUTHORIZED", message: "Sessao nao autenticada.", status: 401 } });
      return;
    }
    sendJson(response, 200, { user: current.user, session: sanitizeSession(current.session) });
    return;
  }

  if (pathname === "/auth/refresh" && request.method === "POST") {
    const sessionId = readSessionId(request);
    const current = sessionId ? await getCurrentUser(sessionId) : null;
    if (!current) {
      sendJson(response, 401, { error: { code: "UNAUTHORIZED", message: "Sessao nao autenticada.", status: 401 } });
      return;
    }
    sendJson(response, 200, { user: current.user, session: sanitizeSession(current.session) });
    return;
  }

  if (pathname === "/auth/sessions" && request.method === "GET") {
    const sessionId = readSessionId(request);
    if (!sessionId) throw new Error("Session not found.");
    sendJson(response, 200, (await listSessions(sessionId)).map(sanitizeSession));
    return;
  }

  if (pathname.startsWith("/auth/sessions/") && request.method === "DELETE") {
    const sessionId = readSessionId(request);
    if (!sessionId) throw new Error("Session not found.");
    await revokeUserSession(sessionId, decodeURIComponent(pathname.split("/").pop() ?? ""));
    sendJson(response, 200, { status: "revoked" });
    return;
  }

  if (pathname === "/auth/password/forgot" && request.method === "POST") {
    sendJson(response, 200, await requestPasswordReset(await readJsonBody(request)));
    return;
  }

  if (pathname === "/auth/password/change" && request.method === "POST") {
    const sessionId = readSessionId(request);
    if (!sessionId) throw new Error("Session not found.");
    await changePassword(sessionId, await readJsonBody(request));
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (pathname === "/auth/password/reset" && request.method === "POST") {
    sendJson(response, 200, { status: "accepted", message: "Reset token accepted for future providers." });
    return;
  }

  if (pathname === "/auth/providers" && request.method === "GET") {
    sendJson(response, 200, listOidcProviders());
    return;
  }

  const oidcMatch = pathname.match(/^\/auth\/oidc\/([^/]+)\/(login|callback)$/);
  if (oidcMatch && request.method === "GET") {
    const provider = decodeURIComponent(oidcMatch[1]);
    if (oidcMatch[2] === "login") {
      sendJson(response, 200, await startOidcLogin(provider));
      return;
    }
    const result = await completeOidcLogin(provider, url.searchParams, {
      ip: request.socket.remoteAddress,
      userAgent: request.headers["user-agent"]
    });
    await eventBus.publish({
      type: "identity.login",
      origin: "auth-route",
      payload: { user_id: result.user.id, provider }
    });
    sendJson(response, 200, { user: result.user, session: sanitizeSession(result.session) }, { "Set-Cookie": result.setCookie });
    return;
  }

  if (pathname === "/auth/identities" && request.method === "GET") {
    const sessionId = readSessionId(request);
    const current = sessionId ? await getCurrentUser(sessionId) : null;
    sendJson(response, current ? 200 : 401, current ? current.user.identities : { error: { code: "UNAUTHORIZED", message: "Sessao nao autenticada.", status: 401 } });
    return;
  }

  sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Auth route not found.", status: 404 } });
}

function sanitizeSession<T extends { ip_hash?: string }>(session: T): Omit<T, "ip_hash"> {
  const clone = { ...session };
  delete clone.ip_hash;
  return clone;
}
