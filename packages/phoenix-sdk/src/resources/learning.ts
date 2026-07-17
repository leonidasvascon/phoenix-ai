import type { PhoenixClient } from "../client.ts";
export class LearningResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } get(): Promise<unknown> { return this.client.request("/learning"); } analyze(): Promise<unknown> { return this.client.request("/learning/analyze", { method: "POST" }); } }


