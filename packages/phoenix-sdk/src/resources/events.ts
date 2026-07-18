import type { PhoenixClient } from "../client.ts";
import type { PhoenixDeadLetterEntry, PhoenixEvent, PhoenixWebhookDelivery } from "../types.ts";

export class EventsResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixEvent[]> {
    return this.client.request("/events");
  }

  get(id: string): Promise<PhoenixEvent> {
    return this.client.request(`/events/${encodeURIComponent(id)}`);
  }

  listDeadLetters(): Promise<PhoenixDeadLetterEntry[]> {
    return this.client.request("/dlq");
  }

  retryDeadLetter(id: string): Promise<PhoenixWebhookDelivery> {
    return this.client.request(`/dlq/${encodeURIComponent(id)}/retry`, { method: "POST" });
  }
}
