import { getTraceId, createTraceId } from "@phoenix-ai/observability";
import { hasPermission, listMembers, type WorkspaceAction, type WorkspaceResource } from "@phoenix-ai/workspace";
import type { IdentityAuthContext } from "./types.ts";

export async function buildAuthorizationContext(input: { userId: string; sessionId: string; workspaceId: string }): Promise<IdentityAuthContext> {
  const members = await listMembers(input.workspaceId);
  const membership = members.find((member) => member.user_id === input.userId && member.status === "active");
  if (!membership) throw new Error("Workspace membership not found.");
  return { type: "user", userId: input.userId, sessionId: input.sessionId, workspaceId: input.workspaceId, role: membership.role };
}

export function assertAuthorization(context: IdentityAuthContext, resource: WorkspaceResource, action: WorkspaceAction): void {
  if (context.type === "service") return;
  if (!hasPermission(context.role, resource, action)) throw new Error("Permission denied.");
}

export function currentTraceId(): string {
  return getTraceId() ?? createTraceId();
}
