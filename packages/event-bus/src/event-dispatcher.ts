import type { PhoenixEvent, WebhookDelivery, WebhookEndpoint } from "./event-schema.ts";
import { dispatchInternalSubscribers } from "./subscription-service.ts";
import { dispatchWebhook } from "./webhook-dispatcher.ts";

export async function dispatchEvent(event: PhoenixEvent, webhooks: WebhookEndpoint[], fetchImpl?: typeof fetch): Promise<WebhookDelivery[]> {
  await dispatchInternalSubscribers(event);
  const activeWebhooks = webhooks.filter((webhook) => webhook.status === "active" && webhook.events.includes(event.type));
  const deliveries: WebhookDelivery[] = [];

  for (const webhook of activeWebhooks) {
    deliveries.push(await dispatchWebhook(event, webhook, fetchImpl));
  }

  return deliveries;
}
