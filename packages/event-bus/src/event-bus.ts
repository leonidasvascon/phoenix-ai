import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getTraceId, logStructured } from "@phoenix-ai/observability";
import { dispatchEvent } from "./event-dispatcher.ts";
import { registerEventType } from "./event-registry.ts";
import type { PhoenixEvent, WebhookDelivery, WebhookEndpoint } from "./event-schema.ts";
import { isKnownPhoenixEventType } from "./event-schema.ts";
import { subscribe, type EventHandler } from "./subscription-service.ts";

export type PublishEventInput = {
  type: string;
  payload?: Record<string, unknown>;
  workspace_id?: string;
  origin?: string;
  trace_id?: string;
};

export class EventBus {
  subscribe(eventType: string, handler: EventHandler): () => void {
    registerEventType(eventType);
    return subscribe(eventType, handler);
  }

  async publish(input: PublishEventInput): Promise<{ event: PhoenixEvent; deliveries: WebhookDelivery[] }> {
    if (!isKnownPhoenixEventType(input.type)) throw new Error("Invalid event type.");
    const event: PhoenixEvent = {
      event_id: randomUUID(),
      type: input.type,
      trace_id: input.trace_id ?? getTraceId(),
      workspace_id: input.workspace_id ?? "default-workspace",
      timestamp: new Date().toISOString(),
      origin: input.origin ?? "phoenix-api",
      payload: sanitizePayload(input.payload ?? {})
    };

    await persistEvent(event);
    const webhooks = await readWebhooks();
    const deliveries = await dispatchEvent(event, webhooks);
    await persistDeliveries(deliveries);
    logStructured("info", "event_bus.event.published", {
      event_id: event.event_id,
      event_type: event.type,
      workspace_id: event.workspace_id,
      delivery_count: deliveries.length
    });

    return { event, deliveries };
  }
}

export const eventBus = new EventBus();

export async function listEvents(): Promise<PhoenixEvent[]> {
  try {
    const parsed = JSON.parse(await readFile(resolve(eventsRoot(), "events.json"), "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as PhoenixEvent[] : [];
  } catch {
    return [];
  }
}

export async function getEvent(eventId: string): Promise<PhoenixEvent | null> {
  const events = await listEvents();
  return events.find((event) => event.event_id === eventId) ?? null;
}

export async function readWebhooks(): Promise<WebhookEndpoint[]> {
  try {
    const parsed = JSON.parse(await readFile(resolve(webhooksRoot(), "webhooks.json"), "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as WebhookEndpoint[] : [];
  } catch {
    return [];
  }
}

export async function writeWebhooks(webhooks: WebhookEndpoint[]): Promise<void> {
  await mkdir(webhooksRoot(), { recursive: true });
  await writeFile(resolve(webhooksRoot(), "webhooks.json"), `${JSON.stringify(webhooks, null, 2)}\n`, "utf8");
}

export async function listDeliveries(): Promise<WebhookDelivery[]> {
  try {
    const parsed = JSON.parse(await readFile(resolve(webhooksRoot(), "deliveries.json"), "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as WebhookDelivery[] : [];
  } catch {
    return [];
  }
}

export async function persistDeliveries(deliveries: WebhookDelivery[]): Promise<void> {
  if (deliveries.length === 0) return;
  const existing = await listDeliveries();
  await mkdir(webhooksRoot(), { recursive: true });
  await writeFile(resolve(webhooksRoot(), "deliveries.json"), `${JSON.stringify([...deliveries, ...existing].slice(0, 500), null, 2)}\n`, "utf8");
}

function eventsRoot(): string {
  return resolve(process.cwd(), ".storage", "events");
}

function webhooksRoot(): string {
  return resolve(process.cwd(), ".storage", "webhooks");
}

async function persistEvent(event: PhoenixEvent): Promise<void> {
  const events = await listEvents();
  await mkdir(eventsRoot(), { recursive: true });
  await writeFile(resolve(eventsRoot(), "events.json"), `${JSON.stringify([event, ...events].slice(0, 1000), null, 2)}\n`, "utf8");
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(payload, (key, value) => /token|secret|key|password/i.test(key) ? "[REDACTED]" : value)) as Record<string, unknown>;
}
