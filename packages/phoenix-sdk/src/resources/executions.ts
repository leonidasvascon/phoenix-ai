import type { PhoenixClient } from "../client.ts";
export class ExecutionsResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; }
  list(): Promise<unknown> { return this.client.request("/executions"); }
  get(id: string): Promise<unknown> { return this.client.request(`/executions/${encodeURIComponent(id)}`); }
}


