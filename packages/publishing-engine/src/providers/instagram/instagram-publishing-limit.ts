import type { PublishingLimit } from "../../types/publication.ts";
import type { InstagramApiClient } from "./instagram-api-client.ts";

export class InstagramPublishingLimit {
  private readonly client: InstagramApiClient;

  constructor(client: InstagramApiClient) {
    this.client = client;
  }

  async check(): Promise<PublishingLimit> {
    const checkedAt = new Date().toISOString();

    try {
      const response = await this.client.getPublishingLimit() as { data?: Array<{ quota_usage?: number; config?: { quota_total?: number } }> };
      const first = response.data?.[0];
      const used = Number(first?.quota_usage ?? 0);
      const total = Number(first?.config?.quota_total ?? 0);

      if (!first || total <= 0) {
        return {
          used,
          remaining: 0,
          checked_at: checkedAt,
          available: false,
          error: "Instagram publishing limit response did not include quota_total."
        };
      }

      return {
        used,
        remaining: total > 0 ? Math.max(total - used, 0) : 0,
        checked_at: checkedAt,
        available: true,
        error: null
      };
    } catch (error) {
      return {
        used: 0,
        remaining: 0,
        checked_at: checkedAt,
        available: false,
        error: error instanceof Error ? error.message : "Instagram publishing limit unavailable."
      };
    }
  }
}
