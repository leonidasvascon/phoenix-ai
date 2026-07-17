import type { IncomingMessage, ServerResponse } from "node:http";
import {
  addMember,
  assertWorkspacePermission,
  createInvitation,
  createWorkspace,
  getWorkspace,
  listMembers,
  listWorkspaces,
  removeMember,
  resolveWorkspaceContext,
  updateMember,
  updateWorkspace
} from "@phoenix-ai/workspace";
import { sendJson } from "../http.ts";

export async function handleWorkspacesRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const [, , workspaceId, resource, memberId] = url.pathname.split("/");
  const userId = getUserId(request);

  try {
    if (request.method === "GET" && !workspaceId) {
      sendJson(response, 200, await listWorkspaces());
      return;
    }

    if (request.method === "POST" && !workspaceId) {
      sendJson(response, 201, await createWorkspace(await readJsonBody(request), userId));
      return;
    }

    if (request.method === "GET" && workspaceId && !resource) {
      const workspace = await getWorkspace(workspaceId);
      if (!workspace) {
        sendJson(response, 404, { status: "error", message: "Workspace not found." });
        return;
      }
      sendJson(response, 200, workspace);
      return;
    }

    if (request.method === "PATCH" && workspaceId && !resource) {
      const context = await resolveWorkspaceContext(request.headers);
      requireSameWorkspace(context.workspace_id, workspaceId);
      assertWorkspacePermission(context, "settings", "write");
      sendJson(response, 200, await updateWorkspace(workspaceId, await readJsonBody(request), userId));
      return;
    }

    if (workspaceId && resource === "members" && request.method === "GET" && !memberId) {
      const context = await resolveWorkspaceContext(request.headers);
      requireSameWorkspace(context.workspace_id, workspaceId);
      assertWorkspacePermission(context, "members", "read");
      sendJson(response, 200, await listMembers(workspaceId));
      return;
    }

    if (workspaceId && resource === "members" && request.method === "POST" && !memberId) {
      const context = await resolveWorkspaceContext(request.headers);
      requireSameWorkspace(context.workspace_id, workspaceId);
      assertWorkspacePermission(context, "members", "write");
      sendJson(response, 201, await addMember(workspaceId, await readJsonBody(request), userId));
      return;
    }

    if (workspaceId && resource === "members" && request.method === "PATCH" && memberId) {
      const context = await resolveWorkspaceContext(request.headers);
      requireSameWorkspace(context.workspace_id, workspaceId);
      assertWorkspacePermission(context, "members", "write");
      sendJson(response, 200, await updateMember(workspaceId, memberId, await readJsonBody(request), userId));
      return;
    }

    if (workspaceId && resource === "members" && request.method === "DELETE" && memberId) {
      const context = await resolveWorkspaceContext(request.headers);
      requireSameWorkspace(context.workspace_id, workspaceId);
      assertWorkspacePermission(context, "members", "manage");
      sendJson(response, 200, await removeMember(workspaceId, memberId, userId));
      return;
    }

    if (workspaceId && resource === "invitations" && request.method === "POST") {
      const context = await resolveWorkspaceContext(request.headers);
      requireSameWorkspace(context.workspace_id, workspaceId);
      assertWorkspacePermission(context, "members", "write");
      sendJson(response, 201, await createInvitation(workspaceId, await readJsonBody(request), userId));
      return;
    }

    sendJson(response, 404, { status: "error", message: "Workspace route not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace request failed.";
    const status = message.includes("permission denied") || message.includes("does not match") ? 403 : message.includes("not found") ? 404 : 400;
    sendJson(response, status, {
      status: "error",
      message
    });
  }
}

function requireSameWorkspace(contextWorkspaceId: string, routeWorkspaceId: string): void {
  if (contextWorkspaceId !== routeWorkspaceId) {
    throw new Error("Workspace context does not match route workspace.");
  }
}

function getUserId(request: IncomingMessage): string {
  const value = request.headers["x-phoenix-user-id"];
  return Array.isArray(value) ? value[0] : value ?? "local-user";
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");

  if (!body.trim()) {
    throw new Error("Request body is required.");
  }

  return JSON.parse(body) as unknown;
}
