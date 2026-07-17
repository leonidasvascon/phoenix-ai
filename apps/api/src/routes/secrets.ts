import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiKey, createSecret, deleteApiKey, getSecret, getSecretsStatus, listApiKeys, listSecretProviderStatuses, listSecrets, revokeApiKey, revokeSecret, rotateApiKey, rotateSecret, validateSecret } from "@phoenix-ai/secrets";
import { createTraceId, getTraceId } from "@phoenix-ai/observability";
import { resolveWorkspaceContext } from "@phoenix-ai/workspace";
import { sendJson } from "../http.ts";
import { readJsonBody } from "../read-json.ts";

export async function handleSecretsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const context = await buildSecretContext(request, url.pathname.includes("/status") ? "validate" : request.method === "POST" ? "create" : "read");

  if (url.pathname === "/secrets/providers" && request.method === "GET") {
    sendJson(response, 200, await listSecretProviderStatuses());
    return;
  }

  if (url.pathname === "/secrets/status" && request.method === "GET") {
    sendJson(response, 200, await getSecretsStatus(context.workspaceId));
    return;
  }

  if (url.pathname === "/secrets" && request.method === "GET") {
    sendJson(response, 200, await listSecrets(context));
    return;
  }

  if (url.pathname === "/secrets" && request.method === "POST") {
    sendJson(response, 201, await createSecret(await readJsonBody(request), { ...context, action: "create" }));
    return;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const secretId = decodeURIComponent(parts[1] ?? "");
  if (!secretId) {
    sendJson(response, 404, { error: { code: "SECRET_NOT_FOUND", message: "Secret not found.", status: 404 } });
    return;
  }

  if (parts.length === 2 && request.method === "GET") {
    const secret = await getSecret(secretId, context);
    sendJson(response, secret ? 200 : 404, secret ?? { error: { code: "SECRET_NOT_FOUND", message: "Secret not found.", status: 404 } });
    return;
  }

  if (parts[2] === "validate" && request.method === "POST") {
    sendJson(response, 200, await validateSecret(secretId, { ...context, action: "validate" }));
    return;
  }

  if (parts[2] === "rotate" && request.method === "POST") {
    sendJson(response, 200, await rotateSecret(secretId, await readJsonBody(request), { ...context, action: "rotate" }));
    return;
  }

  if (parts[2] === "revoke" && request.method === "POST") {
    sendJson(response, 200, await revokeSecret(secretId, { ...context, action: "revoke" }));
    return;
  }

  sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed.", status: 405 } });
}

export async function handleApiKeysRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const context = await buildSecretContext(request, request.method === "POST" ? "create" : "read");

  if (url.pathname === "/api-keys" && request.method === "GET") {
    sendJson(response, 200, await listApiKeys(context));
    return;
  }

  if (url.pathname === "/api-keys" && request.method === "POST") {
    sendJson(response, 201, await createApiKey(await readJsonBody(request), { ...context, action: "create" }));
    return;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const keyId = decodeURIComponent(parts[1] ?? "");
  if (parts[2] === "rotate" && request.method === "POST") {
    sendJson(response, 200, await rotateApiKey(keyId, { ...context, action: "rotate" }));
    return;
  }
  if (parts[2] === "revoke" && request.method === "POST") {
    sendJson(response, 200, await revokeApiKey(keyId, { ...context, action: "revoke" }));
    return;
  }
  if (parts.length === 2 && request.method === "DELETE") {
    sendJson(response, 200, await deleteApiKey(keyId, { ...context, action: "revoke" }));
    return;
  }

  sendJson(response, 404, { error: { code: "API_KEY_NOT_FOUND", message: "API key route not found.", status: 404 } });
}

async function buildSecretContext(request: IncomingMessage, action: "read" | "create" | "rotate" | "revoke" | "validate") {
  const workspace = await resolveWorkspaceContext(request.headers);
  const userHeader = request.headers["x-phoenix-user-id"];
  const userId = Array.isArray(userHeader) ? userHeader[0] : userHeader ?? workspace.user_id;
  return {
    workspaceId: workspace.workspace_id,
    actorType: userId === "local-user" ? "service" as const : "user" as const,
    actorId: userId,
    resource: "secrets",
    action,
    traceId: getTraceId() ?? createTraceId(),
    scopes: ["secrets:*", "providers:use"]
  };
}
