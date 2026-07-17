import { hasPermission, listMembers } from "@phoenix-ai/workspace";
import type { SecretAccessContext } from "./types.ts";

const secretActions = new Set(["read", "create", "rotate", "revoke", "validate"]);

export async function assertSecretAccess(context: SecretAccessContext, targetWorkspaceId: string): Promise<void> {
  if (context.workspaceId !== targetWorkspaceId) throw new Error("Secret belongs to another workspace.");
  if (context.actorType === "system") return;
  if (context.actorType === "service") {
    if (context.scopes?.includes("secrets:*") || context.scopes?.includes(`secrets:${context.action}`)) return;
    if (context.action === "read" && context.scopes?.includes("providers:use")) return;
    throw new Error("Secret scope denied.");
  }
  const members = await listMembers(context.workspaceId);
  const member = members.find((item) => item.user_id === context.actorId && item.status === "active");
  if (!member) throw new Error("Workspace membership not found.");
  if ((context.action === "read" || context.action === "validate") && (member.role === "owner" || member.role === "admin")) return;
  if ((context.action === "create" || context.action === "rotate" || context.action === "revoke") && (member.role === "owner" || member.role === "admin")) return;
  throw new Error("Secret permission denied.");
}
