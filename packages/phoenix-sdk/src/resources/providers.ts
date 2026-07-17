import type { PhoenixClient } from "../client.ts";
export class ProvidersResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } list(): Promise<unknown> { return this.client.request("/providers"); } status(): Promise<unknown> { return this.client.request("/providers/status"); } }


