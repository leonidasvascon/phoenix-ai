import type { PhoenixClient } from "../client.ts";
export class SchedulerResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; } list(): Promise<unknown> { return this.client.request("/scheduled-jobs"); } create(input: unknown): Promise<unknown> { return this.client.request("/scheduled-jobs", { method: "POST", body: input }); } runDue(): Promise<unknown> { return this.client.request("/scheduled-jobs/run-due", { method: "POST" }); } delete(id: string): Promise<unknown> { return this.client.request(`/scheduled-jobs/${encodeURIComponent(id)}`, { method: "DELETE" }); } }


