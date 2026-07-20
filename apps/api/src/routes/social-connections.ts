import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../http.ts";
import {
  createInstagramConnection,
  deleteSocialConnection,
  getConnectionAccounts,
  getConnectionPermissions,
  getSocialConnection,
  listSocialConnections,
  testSocialConnection,
  updateSocialConnection
} from "../services/social-connections-service.ts";

export async function handleSocialConnectionsRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , connectionId, action] = url.pathname.split("/");
  const workspaceId = readWorkspaceId(request);

  if (request.method === "GET" && !connectionId) {
    sendJson(response, 200, await listSocialConnections(workspaceId));
    return;
  }

  if (request.method === "POST" && connectionId === "instagram") {
    try {
      sendJson(response, 201, await createInstagramConnection(await readJsonBody(request) as Record<string, unknown>, workspaceId));
    } catch (error) {
      sendJson(response, 400, { status: "error", message: error instanceof Error ? error.message : "Conexão inválida." });
    }
    return;
  }

  if (request.method === "GET" && connectionId && !action) {
    const connection = await getSocialConnection(connectionId, workspaceId);
    if (!connection) {
      sendJson(response, 404, { status: "error", message: "Conexão social não encontrada." });
      return;
    }
    sendJson(response, 200, connection);
    return;
  }

  if (request.method === "PATCH" && connectionId && !action) {
    const connection = await updateSocialConnection(connectionId, await readJsonBody(request) as Record<string, unknown>, workspaceId);
    if (!connection) {
      sendJson(response, 404, { status: "error", message: "Conexão social não encontrada." });
      return;
    }
    sendJson(response, 200, connection);
    return;
  }

  if (request.method === "DELETE" && connectionId && !action) {
    sendJson(response, 200, { archived: await deleteSocialConnection(connectionId, workspaceId) });
    return;
  }

  if (request.method === "POST" && connectionId && action === "test") {
    const result = await testSocialConnection(connectionId, workspaceId);
    if (!result) {
      sendJson(response, 404, { status: "error", message: "Conexão social não encontrada." });
      return;
    }
    sendJson(response, 200, result);
    return;
  }

  if (request.method === "POST" && connectionId && action === "refresh") {
    const result = await testSocialConnection(connectionId, workspaceId);
    if (!result) {
      sendJson(response, 404, { status: "error", message: "Conexão social não encontrada." });
      return;
    }
    sendJson(response, 200, result);
    return;
  }

  if (request.method === "GET" && connectionId && action === "accounts") {
    const accounts = await getConnectionAccounts(connectionId, workspaceId);
    if (!accounts) {
      sendJson(response, 404, { status: "error", message: "Conexão social não encontrada." });
      return;
    }
    sendJson(response, 200, accounts);
    return;
  }

  if (request.method === "GET" && connectionId && action === "permissions") {
    const permissions = await getConnectionPermissions(connectionId, workspaceId);
    if (!permissions) {
      sendJson(response, 404, { status: "error", message: "Conexão social não encontrada." });
      return;
    }
    sendJson(response, 200, permissions);
    return;
  }

  sendJson(response, 405, { status: "error", message: "Method not allowed." });
}

function readWorkspaceId(request: IncomingMessage): string {
  const value = request.headers["x-phoenix-workspace-id"];
  return Array.isArray(value) ? value[0] ?? "default-workspace" : value ?? "default-workspace";
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body.trim() ? JSON.parse(body) : {};
}
