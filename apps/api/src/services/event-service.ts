import { randomUUID } from "node:crypto";
import {
  dispatchWebhook,
  eventBus,
  getEvent,
  listDeadLetters,
  listDeliveries,
  listEvents,
  persistDeliveries,
  readWebhooks,
  removeDeadLetter,
  writeWebhooks,
  type PhoenixEvent,
  type WebhookEndpoint
} from "@phoenix-ai/event-bus";

type WebhookInput = {
  url?: unknown;
  events?: unknown;
  secret?: unknown;
  status?: unknown;
  retries?: unknown;
  timeout_ms?: unknown;
};

export function listEventHistory(): Promise<PhoenixEvent[]> {
  return listEvents();
}

export async function getEventById(eventId: string): Promise<PhoenixEvent | null> {
  validateId(eventId);
  return getEvent(eventId);
}

export async function listWebhookEndpoints() {
  const [webhooks, deliveries] = await Promise.all([readWebhooks(), listDeliveries()]);

  return webhooks.map((webhook) => ({
    ...sanitizeWebhook(webhook),
    deliveries: deliveries.filter((delivery) => delivery.webhook_id === webhook.id).slice(0, 10)
  }));
}

export async function getWebhookEndpoint(webhookId: string) {
  const webhook = await getRawWebhook(webhookId);
  if (!webhook) return null;
  const deliveries = await listDeliveries();

  return {
    ...sanitizeWebhook(webhook),
    deliveries: deliveries.filter((delivery) => delivery.webhook_id === webhook.id)
  };
}

export async function createWebhookEndpoint(input: unknown) {
  const payload = normalizeWebhookInput(input, false);
  const webhooks = await readWebhooks();
  const now = new Date().toISOString();
  const webhook: WebhookEndpoint = {
    id: randomUUID(),
    url: payload.url ?? "",
    events: payload.events ?? [],
    secret: payload.secret,
    status: payload.status ?? "active",
    retries: payload.retries ?? 5,
    timeout_ms: payload.timeout_ms ?? 10000,
    created_at: now,
    updated_at: now
  };
  await writeWebhooks([webhook, ...webhooks]);

  return sanitizeWebhook(webhook);
}

export async function updateWebhookEndpoint(webhookId: string, input: unknown) {
  validateId(webhookId);
  const payload = normalizeWebhookInput(input, true);
  const webhooks = await readWebhooks();
  const index = webhooks.findIndex((item) => item.id === webhookId);
  if (index < 0) return null;
  const current = webhooks[index];
  const updated: WebhookEndpoint = {
    ...current,
    ...Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)),
    updated_at: new Date().toISOString()
  };
  webhooks[index] = updated;
  await writeWebhooks(webhooks);

  return sanitizeWebhook(updated);
}

export async function deleteWebhookEndpoint(webhookId: string): Promise<boolean> {
  validateId(webhookId);
  const webhooks = await readWebhooks();
  const next = webhooks.filter((item) => item.id !== webhookId);
  await writeWebhooks(next);

  return next.length !== webhooks.length;
}

export async function testWebhookEndpoint(webhookId: string) {
  const webhook = await getRawWebhook(webhookId);
  if (!webhook) throw new Error("Webhook not found.");
  const { event } = await eventBus.publish({
    type: webhook.events[0] ?? "task.completed",
    origin: "phoenix-api.webhooks.test",
    payload: { test: true, webhook_id: webhook.id }
  });
  const delivery = await dispatchWebhook(event, webhook);
  await persistDeliveries([delivery]);

  return { event, delivery };
}

export function listDeadLetterQueue() {
  return listDeadLetters();
}

export async function retryDeadLetter(deadLetterId: string) {
  validateId(deadLetterId);
  const entries = await listDeadLetters();
  const entry = entries.find((item) => item.id === deadLetterId);
  if (!entry) throw new Error("Dead letter item not found.");
  const webhook = await getRawWebhook(entry.webhook_id);
  if (!webhook) throw new Error("Webhook not found.");
  await removeDeadLetter(deadLetterId);
  const delivery = await dispatchWebhook(entry.payload, webhook);
  await persistDeliveries([delivery]);

  return delivery;
}

async function getRawWebhook(webhookId: string): Promise<WebhookEndpoint | null> {
  validateId(webhookId);
  const webhooks = await readWebhooks();
  return webhooks.find((item) => item.id === webhookId) ?? null;
}

function normalizeWebhookInput(input: unknown, partial: boolean) {
  if (!input || typeof input !== "object") throw new Error("Webhook payload is required.");
  const payload = input as WebhookInput;
  const url = typeof payload.url === "string" ? payload.url.trim() : undefined;
  const events = Array.isArray(payload.events) ? payload.events.map((item) => String(item).trim()).filter(Boolean) : undefined;

  if (!partial || url !== undefined) validateWebhookUrl(url ?? "");
  if (!partial || events !== undefined) {
    if (!events || events.length === 0) throw new Error("Webhook events are required.");
  }

  return {
    url,
    events,
    secret: typeof payload.secret === "string" && payload.secret.trim() ? payload.secret.trim() : undefined,
    status: payload.status === "disabled" ? "disabled" as const : payload.status === "active" ? "active" as const : undefined,
    retries: typeof payload.retries === "number" && payload.retries >= 0 ? payload.retries : undefined,
    timeout_ms: typeof payload.timeout_ms === "number" && payload.timeout_ms >= 1000 ? payload.timeout_ms : undefined
  };
}

function validateWebhookUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Webhook URL is invalid.");
  }
  if (url.protocol !== "https:" && process.env.PHOENIX_WEBHOOK_ALLOW_HTTP !== "true") {
    throw new Error("Webhook URL must use HTTPS.");
  }
}

function validateId(value: string): void {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new Error("Invalid id.");
}

function sanitizeWebhook(webhook: WebhookEndpoint) {
  const { secret, ...safe } = webhook;
  return {
    ...safe,
    has_secret: Boolean(secret)
  };
}
