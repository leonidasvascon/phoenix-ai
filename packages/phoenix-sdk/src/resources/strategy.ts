import type { PhoenixClient } from "../client.ts";
export class StrategyResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } get(): Promise<unknown> { return this.client.request("/strategy"); } generate(input: unknown): Promise<unknown> { return this.client.request("/strategy/generate", { method: "POST", body: input }); } }


