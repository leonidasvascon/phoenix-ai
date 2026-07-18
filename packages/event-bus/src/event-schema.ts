export const phoenixEventTypes = [
  "task.created",
  "task.completed",
  "task.failed",
  "workflow.started",
  "workflow.completed",
  "workflow.failed",
  "publication.started",
  "publication.completed",
  "publication.failed",
  "evaluation.completed",
  "plugin.enabled",
  "plugin.disabled",
  "identity.login",
  "secret.rotated"
] as const;

export type PhoenixEventType = typeof phoenixEventTypes[number] | string;

export type PhoenixEvent = {
  event_id: string;
  type: PhoenixEventType;
  trace_id?: string;
  workspace_id: string;
  timestamp: string;
  origin: string;
  payload: Record<string, unknown>;
};

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  status: "active" | "disabled";
  retries: number;
  timeout_ms: number;
  created_at: string;
  updated_at: string;
  last_delivery_at?: string;
  last_error?: string;
};

export type WebhookDelivery = {
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

export type DeadLetterEntry = WebhookDelivery & {
  payload: PhoenixEvent;
  reason: string;
};

export function isKnownPhoenixEventType(type: string): boolean {
  return phoenixEventTypes.includes(type as (typeof phoenixEventTypes)[number]) || /^[a-z0-9-]+\.[a-z0-9-]+$/.test(type);
}
