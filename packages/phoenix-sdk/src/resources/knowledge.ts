import type { PhoenixClient } from "../client.ts";
import type { PhoenixKnowledgeEntity, PhoenixKnowledgeGraph, PhoenixKnowledgeIngestRequest, PhoenixKnowledgeIngestResponse, PhoenixKnowledgeRelation, PhoenixKnowledgeSearchResponse } from "../types.ts";

export class KnowledgeResource {
  private readonly client: PhoenixClient;

  constructor(client: PhoenixClient) {
    this.client = client;
  }

  entities(): Promise<PhoenixKnowledgeEntity[]> {
    return this.client.request("/knowledge/entities");
  }

  relations(): Promise<PhoenixKnowledgeRelation[]> {
    return this.client.request("/knowledge/relations");
  }

  graph(): Promise<PhoenixKnowledgeGraph> {
    return this.client.request("/knowledge/graph");
  }

  search(query: string, options: { workspaceId?: string; limit?: number } = {}): Promise<PhoenixKnowledgeSearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (options.workspaceId) params.set("workspace_id", options.workspaceId);
    if (options.limit) params.set("limit", String(options.limit));
    return this.client.request(`/knowledge/search?${params.toString()}`);
  }

  ingest(input: PhoenixKnowledgeIngestRequest = {}): Promise<PhoenixKnowledgeIngestResponse> {
    return this.client.request("/knowledge/ingest", { method: "POST", body: input });
  }
}
