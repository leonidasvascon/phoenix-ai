import type { PhoenixClient } from "../client.ts";
import type { PhoenixPluginRecord } from "../types.ts";

export class PluginsResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  list(): Promise<PhoenixPluginRecord[]> {
    return this.client.request("/plugins");
  }

  get(id: string): Promise<PhoenixPluginRecord> {
    return this.client.request(`/plugins/${encodeURIComponent(id)}`);
  }

  install(id: string): Promise<PhoenixPluginRecord> {
    return this.client.request("/plugins/install", { method: "POST", body: { id } });
  }

  enable(id: string): Promise<PhoenixPluginRecord> {
    return this.client.request("/plugins/enable", { method: "POST", body: { id } });
  }

  disable(id: string): Promise<PhoenixPluginRecord> {
    return this.client.request("/plugins/disable", { method: "POST", body: { id } });
  }

  uninstall(id: string): Promise<{ status: "uninstalled"; id: string }> {
    return this.client.request(`/plugins/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}
