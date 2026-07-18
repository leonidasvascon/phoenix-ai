import type { PhoenixClient } from "../client.ts";
import type { PhoenixWorkflow, PhoenixWorkflowExecution } from "../types.ts";

export class WorkflowsResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixWorkflow[]> {
    return this.client.request("/workflows");
  }

  create(input: Partial<PhoenixWorkflow>): Promise<PhoenixWorkflow> {
    return this.client.request("/workflows", { method: "POST", body: input });
  }

  get(id: string): Promise<PhoenixWorkflow> {
    return this.client.request(`/workflows/${encodeURIComponent(id)}`);
  }

  update(id: string, input: Partial<PhoenixWorkflow>): Promise<PhoenixWorkflow> {
    return this.client.request(`/workflows/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  }

  delete(id: string): Promise<{ status: "deleted"; id: string }> {
    return this.client.request(`/workflows/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  run(id: string, input: Record<string, unknown> = {}): Promise<PhoenixWorkflowExecution> {
    return this.client.request(`/workflows/${encodeURIComponent(id)}/run`, { method: "POST", body: input });
  }

  executions(id: string): Promise<PhoenixWorkflowExecution[]> {
    return this.client.request(`/workflows/${encodeURIComponent(id)}/executions`);
  }
}
