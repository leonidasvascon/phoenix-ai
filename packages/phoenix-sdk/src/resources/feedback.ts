import type { PhoenixClient } from "../client.ts";
export class FeedbackResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } list(): Promise<unknown> { return this.client.request("/feedback"); } create(input: unknown): Promise<unknown> { return this.client.request("/feedback", { method: "POST", body: input }); } get(executionId: string): Promise<unknown> { return this.client.request(`/feedback/${encodeURIComponent(executionId)}`); } }


