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
export type PhoenixErrorPayload = {
  error: { code: string; message: string; status: number; trace_id?: string };
};
export type PhoenixClientOptions = {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};
export type RequestOptions = {
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  body?: unknown;
};
