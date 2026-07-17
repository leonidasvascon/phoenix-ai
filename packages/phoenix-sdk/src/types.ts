export type PhoenixFormat = "reel" | "carousel" | "story";
export type PhoenixTaskRequest = {
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: PhoenixFormat;
  language?: string;
};
export type PhoenixRuntimeResponse = {
  status: "success" | "error";
  execution_id: string;
  score: number;
  execution: { id: string; trace_id?: string; [key: string]: unknown };
  output: Record<string, unknown>;
  media_package?: Record<string, unknown>;
};
export type PhoenixBrand = {
  version: string | number;
  brand: { id: string; name: string };
  purpose?: string;
  [key: string]: unknown;
};
export type PhoenixWorkspaceRole = "owner" | "admin" | "editor" | "analyst" | "viewer";
export type PhoenixWorkspace = {
  id: string;
  name: string;
  status: "active" | "archived";
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
export type PhoenixWorkspaceMember = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: PhoenixWorkspaceRole;
  status: "active" | "invited" | "disabled";
};
export type PhoenixUser = {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled" | "locked";
  email_verified: boolean;
};
export type PhoenixSession = {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
  revoked_at: string | null;
  user_agent_summary: string;
};
export type PhoenixSecretMetadata = {
  id: string;
  workspaceId: string;
  name: string;
  namespace: string;
  provider: "environment" | "encrypted_file" | "memory";
  reference: string;
  status: "active" | "disabled" | "rotating" | "revoked" | "invalid";
  version: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
};
export type PhoenixApiKeyMetadata = {
  id: string;
  key_id: string;
  key_prefix: string;
  workspace_id: string;
  scopes: string[];
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
  expires_at?: string;
  last_used_at?: string;
};
export type PhoenixErrorPayload = {
  error: { code: string; message: string; status: number; trace_id?: string };
};
export type PhoenixClientOptions = {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  credentials?: RequestCredentials;
  timeoutMs?: number;
  fetch?: typeof fetch;
};
export type RequestOptions = {
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  body?: unknown;
};
