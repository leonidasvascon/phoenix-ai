import type { PhoenixClient } from "../client.ts";
export class PublicationsResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } list(): Promise<unknown> { return this.client.request("/publications"); } get(id: string): Promise<unknown> { return this.client.request(`/publications/${encodeURIComponent(id)}`); } create(input: unknown): Promise<unknown> { return this.client.request("/publications", { method: "POST", body: input }); } publish(id: string): Promise<unknown> { return this.client.request(`/publications/${encodeURIComponent(id)}/publish`, { method: "POST" }); } }


