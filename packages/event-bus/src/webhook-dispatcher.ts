import { randomUUID } from "node:crypto";
import type { PhoenixEvent, WebhookDelivery, WebhookEndpoint } from "./event-schema.ts";
import { addDeadLetter } from "./dead-letter-queue.ts";
import { maxRetryAttempts, nextRetryAt } from "./retry-service.ts";
import { signWebhookPayload } from "./signature-service.ts";

export async function dispatchWebhook(event: PhoenixEvent, webhook: WebhookEndpoint, fetchImpl: typeof fetch = fetch): Promise<WebhookDelivery> {
  const now = new Date().toISOString();
  const delivery: WebhookDelivery = {
    id: randomUUID(),
    event_id: event.event_id,
    webhook_id: webhook.id,
    event_type: event.type,
    url: webhook.url,
    status: "pending",
    attempts: 1,
    created_at: now,
    updated_at: now
  };

  const body = JSON.stringify(event);
  const timestamp = new Date().toISOString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Phoenix-Event": event.type,
    "X-Phoenix-Delivery": delivery.id,
    "X-Phoenix-Timestamp": timestamp
  };
  if (webhook.secret) headers["X-Phoenix-Signature"] = signWebhookPayload(webhook.secret, timestamp, body);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhook.timeout_ms);
    const response = await fetchImpl(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal
    });
    clearTimeout(timeout);
    delivery.response_status = response.status;
    delivery.status = response.ok ? "success" : "failed";
    delivery.error = response.ok ? undefined : `Webhook returned HTTP ${response.status}.`;
  } catch (error) {
    delivery.status = "failed";
    delivery.error = error instanceof Error ? error.message : "Webhook delivery failed.";
  }

  delivery.updated_at = new Date().toISOString();
  if (delivery.status === "failed") {
    const retryLimit = Math.max(0, webhook.retries ?? maxRetryAttempts());
    delivery.next_retry_at = delivery.attempts < retryLimit ? nextRetryAt(delivery.attempts) ?? undefined : undefined;
    if (delivery.attempts >= retryLimit || !delivery.next_retry_at) {
      delivery.status = "dead_letter";
      await addDeadLetter({ ...delivery, payload: event, reason: delivery.error ?? "Webhook delivery failed." });
    }
  }

  return delivery;
}
