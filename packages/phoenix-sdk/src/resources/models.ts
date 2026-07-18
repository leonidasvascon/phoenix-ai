import type { PhoenixClient } from "../client.ts";
import type { PhoenixModelHealth, PhoenixModelPolicy, PhoenixModelProvider, PhoenixModelTestRequest, PhoenixModelTestResponse, PhoenixModelsResponse } from "../types.ts";

export class ModelsResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixModelsResponse> {
    return this.client.request("/models");
  }

  providers(): Promise<PhoenixModelProvider[]> {
    return this.client.request("/models/providers");
  }

  health(): Promise<PhoenixModelHealth[]> {
    return this.client.request("/models/health");
  }

  policies(): Promise<PhoenixModelPolicy[]> {
    return this.client.request("/models/policies");
  }

  updatePolicy(policy: Partial<PhoenixModelPolicy>): Promise<PhoenixModelPolicy> {
    return this.client.request("/models/policies", { method: "PATCH", body: policy });
  }

  test(input: PhoenixModelTestRequest = {}): Promise<PhoenixModelTestResponse> {
    return this.client.request("/models/test", { method: "POST", body: input });
  }
}
