import type { WorkspaceRole } from "@phoenix-ai/workspace";

export type IdentityProvider = "local" | "mock" | string;
export type IdentityUserStatus = "active" | "disabled" | "locked";
export type IdentityUser = {
  id: string;
  email: string;
  name: string;
  status: IdentityUserStatus;
  email_verified: boolean;
  identities: Array<{ provider: IdentityProvider; subject: string }>;
  password_hash?: string;
  failed_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};
export type IdentitySession = {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
  revoked_at: string | null;
  ip_hash: string;
  user_agent_summary: string;
};
export type IdentityAuthContext =
  | { type: "service"; workspaceId: string; scopes: string[] }
  | { type: "user"; userId: string; sessionId: string; workspaceId: string; role: WorkspaceRole };
export type IdentityAuditEvent = {
  timestamp: string;
  event: string;
  user_id: string | null;
  workspace_id: string | null;
  session_id: string | null;
  provider?: string;
  result: "success" | "failure" | "info";
  reason_code?: string;
  trace_id: string;
};
