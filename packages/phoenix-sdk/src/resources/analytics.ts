import type { PhoenixClient } from "../client.ts";
export class AnalyticsResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } get(): Promise<unknown> { return this.client.request("/analytics"); } }


