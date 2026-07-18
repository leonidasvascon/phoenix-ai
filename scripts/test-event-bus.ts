import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { dispatchWebhook, eventBus, listDeadLetters, listEvents, readWebhooks, signWebhookPayload, verifyWebhookSignature, writeWebhooks, type PhoenixEvent, type WebhookEndpoint } from "@phoenix-ai/event-bus";

const storageRoot = resolve(process.cwd(), ".storage");

await rm(resolve(storageRoot, "events"), { recursive: true, force: true });
await rm(resolve(storageRoot, "webhooks"), { recursive: true, force: true });
await rm(resolve(storageRoot, "dlq"), { recursive: true, force: true });
process.env.PHOENIX_WEBHOOK_ALLOW_HTTP = "true";

let internalReceived = false;
const unsubscribe = eventBus.subscribe("workflow.completed", async (event) => {
  internalReceived = event.type === "workflow.completed";
});

const webhook: WebhookEndpoint = {
  id: "test-webhook",
  url: "http://127.0.0.1/webhook",
  events: ["workflow.completed"],
  secret: "test-secret",
  status: "active",
  retries: 1,
  timeout_ms: 1000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

let signed = false;
const okFetch: typeof fetch = async (_input, init) => {
  const headers = new Headers(init?.headers);
  const timestamp = headers.get("X-Phoenix-Timestamp") ?? "";
  const body = String(init?.body ?? "");
  signed = verifyWebhookSignature({
    secret: webhook.secret ?? "",
    timestamp,
    body,
    signature: headers.get("X-Phoenix-Signature") ?? ""
  });

  return new Response("ok", { status: 200 });
};

const { event } = await eventBus.publish({
  type: "workflow.completed",
  origin: "event-bus-test",
  workspace_id: "workspace-test",
  payload: { token: "should-not-persist", result: "ok" }
});
await writeWebhooks([webhook]);
const deliveries = await dispatchWebhook(event, webhook, okFetch);
assert(internalReceived, "internal subscriber should receive workflow.completed");
assert(signed, "webhook delivery should be HMAC signed");
assert(deliveries.status === "success", "webhook delivery should succeed");

const events = await listEvents();
assert(events[0]?.payload.token === "[REDACTED]", "event payload should be sanitized");
assert((await readWebhooks()).length === 1, "webhook should be persisted");

const failedEvent: PhoenixEvent = {
  ...event,
  event_id: "failed-event",
  timestamp: new Date().toISOString()
};
await dispatchWebhook(failedEvent, { ...webhook, id: "dead-webhook", retries: 1 }, async () => new Response("fail", { status: 500 }));
const deadLetters = await listDeadLetters();
assert(deadLetters.length === 1, "failed webhook should move to DLQ after retry limit");
assert(deadLetters[0]?.next_retry_at === undefined, "dead letter should not keep retry schedule");

const timestamp = new Date().toISOString();
const body = JSON.stringify({ ok: true });
const signature = signWebhookPayload("replay-secret", timestamp, body);
assert(verifyWebhookSignature({ secret: "replay-secret", timestamp, body, signature }), "fresh signature should validate");
assert(!verifyWebhookSignature({ secret: "replay-secret", timestamp, body, signature, now: new Date(Date.now() + 10 * 60 * 1000), toleranceSeconds: 60 }), "old timestamp should fail replay protection");

unsubscribe();
await rm(resolve(storageRoot, "events"), { recursive: true, force: true });
await rm(resolve(storageRoot, "webhooks"), { recursive: true, force: true });
await rm(resolve(storageRoot, "dlq"), { recursive: true, force: true });
console.log("Event Bus checks passed.");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
