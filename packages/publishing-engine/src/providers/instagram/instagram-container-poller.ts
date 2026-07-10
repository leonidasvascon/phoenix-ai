import type { InstagramApiClient } from "./instagram-api-client.ts";
import type { InstagramContainerStatusResponse } from "./instagram-types.ts";

export class InstagramContainerPoller {
  private readonly client: InstagramApiClient;
  private readonly options: { pollIntervalMs: number; timeoutMs: number };

  constructor(
    client: InstagramApiClient,
    options: { pollIntervalMs: number; timeoutMs: number }
  ) {
    this.client = client;
    this.options = options;
  }

  async waitUntilReady(
    containerId: string,
    onStatus?: (status: string) => Promise<void>
  ): Promise<InstagramContainerStatusResponse> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= this.options.timeoutMs) {
      const status = await this.client.getContainerStatus(containerId);
      const statusCode = status.status_code ?? "UNKNOWN";
      await onStatus?.(statusCode);

      if (statusCode === "FINISHED" || statusCode === "PUBLISHED") {
        return status;
      }

      if (statusCode === "ERROR" || statusCode === "EXPIRED") {
        throw new Error(`Instagram container failed with status ${statusCode}.`);
      }

      await sleep(this.options.pollIntervalMs);
    }

    throw new Error("Instagram container processing timed out.");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
