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
export type PhoenixPluginCapability = "agent" | "provider" | "tool" | "analytics" | "scheduler" | "publishing" | "strategy" | "evaluation" | "studio";
export type PhoenixPluginManifest = {
  id: string;
  name: string;
  version: string;
  engine: string;
  author: string;
  capabilities: PhoenixPluginCapability[];
  entry?: string;
  description?: string;
  permissions?: string[];
};
export type PhoenixPluginRecord = {
  id: string;
  manifest: PhoenixPluginManifest;
  path: string;
  status: "installed" | "enabled" | "disabled" | "invalid";
  installedAt: string;
  enabledAt?: string;
  disabledAt?: string;
  error?: string;
  logs: Array<{ timestamp: string; level: "info" | "warn" | "error"; message: string; metadata?: Record<string, unknown> }>;
};
export type PhoenixWorkflow = {
  id: string;
  name: string;
  description?: string;
  trigger: { type: "manual" | "scheduler" | "webhook"; config?: Record<string, unknown> };
  nodes: Array<{ id: string; type: string; name: string; config?: Record<string, unknown>; position?: { x: number; y: number } }>;
  edges: Array<{ id: string; from: string; to: string; condition?: string }>;
  variables: Record<string, unknown>;
  metadata: { workspace_id: string; created_at: string; updated_at: string; version: string };
};
export type PhoenixWorkflowExecution = {
  id: string;
  workflow_id: string;
  status: "running" | "success" | "failed";
  started_at: string;
  completed_at: string;
  steps: Array<{ node_id: string; node_type: string; status: "success" | "skipped" | "failed"; error?: string; output?: unknown }>;
  context: Record<string, unknown>;
  error?: string;
};
export type PhoenixEvent = {
  event_id: string;
  type: string;
  trace_id?: string;
  workspace_id: string;
  timestamp: string;
  origin: string;
  payload: Record<string, unknown>;
};
export type PhoenixWebhookDelivery = {
  id: string;
  event_id: string;
  webhook_id: string;
  event_type: string;
  url: string;
  status: "pending" | "success" | "failed" | "dead_letter";
  attempts: number;
  next_retry_at?: string;
  response_status?: number;
  error?: string;
  created_at: string;
  updated_at: string;
};
export type PhoenixWebhook = {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled";
  retries: number;
  timeout_ms: number;
  created_at: string;
  updated_at: string;
  last_delivery_at?: string;
  last_error?: string;
  has_secret: boolean;
  deliveries?: PhoenixWebhookDelivery[];
};
export type PhoenixWebhookCreateRequest = {
  url: string;
  events: string[];
  secret?: string;
  status?: "active" | "disabled";
  retries?: number;
  timeout_ms?: number;
};
export type PhoenixDeadLetterEntry = PhoenixWebhookDelivery & {
  payload: PhoenixEvent;
  reason: string;
};
export type PhoenixKnowledgeEntity = {
  id: string;
  type: string;
  label: string;
  workspace_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
export type PhoenixKnowledgeRelation = {
  id: string;
  from: string;
  to: string;
  type: string;
  workspace_id: string;
  weight: number;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type PhoenixKnowledgeSearchResult = {
  id: string;
  entity_id: string;
  document_id: string;
  workspace_id: string;
  source: string;
  chunk: string;
  score: number;
  created_at: string;
  metadata: Record<string, unknown>;
  entity?: { id: string; type: string; label: string };
};
export type PhoenixKnowledgeSearchResponse = {
  query: string;
  workspace_id?: string;
  results: PhoenixKnowledgeSearchResult[];
  metrics: Record<string, number>;
};
export type PhoenixKnowledgeGraph = {
  nodes: PhoenixKnowledgeEntity[];
  edges: PhoenixKnowledgeRelation[];
  embeddings: Array<{ id: string; entity_id: string; workspace_id: string; text: string; vector: number[]; source: string; created_at: string }>;
  provenance: PhoenixKnowledgeSearchResult[];
  summary: { entities: number; relations: number; embeddings: number; provenance: number };
};
export type PhoenixKnowledgeIngestRequest = {
  workspace_id?: string;
  sources?: string[];
};
export type PhoenixKnowledgeIngestResponse = {
  status: "success";
  workspace_id: string;
  sources: string[];
  entities: number;
  relations: number;
  embeddings: number;
  provenance: number;
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
