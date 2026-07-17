import type { PhoenixRuntimeResponse, PhoenixTaskRequest } from "../types.ts";
import type { PhoenixClient } from "../client.ts";
export class TasksResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; }
  create(input: PhoenixTaskRequest): Promise<PhoenixRuntimeResponse> { return this.client.request("/tasks", { method: "POST", body: input }); }
  batch(items: PhoenixTaskRequest[]): Promise<unknown> { return this.client.request("/tasks/batch", { method: "POST", body: { items } }); }
}


