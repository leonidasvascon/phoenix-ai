import type { PhoenixClient } from "../client.ts";
import type { PhoenixWebhook, PhoenixWebhookCreateRequest, PhoenixWebhookDelivery } from "../types.ts";

export class WebhooksResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixWebhook[]> {
    return this.client.request("/webhooks");
  }

  create(input: PhoenixWebhookCreateRequest): Promise<PhoenixWebhook> {
    return this.client.request("/webhooks", { method: "POST", body: input });
  }

  get(id: string): Promise<PhoenixWebhook> {
    return this.client.request(`/webhooks/${encodeURIComponent(id)}`);
  }

  update(id: string, input: Partial<PhoenixWebhookCreateRequest>): Promise<PhoenixWebhook> {
    return this.client.request(`/webhooks/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  }

  delete(id: string): Promise<{ status: "deleted"; id: string }> {
    return this.client.request(`/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  test(id: string): Promise<{ event: Record<string, unknown>; delivery: PhoenixWebhookDelivery }> {
    return this.client.request(`/webhooks/${encodeURIComponent(id)}/test`, { method: "POST" });
  }
}
