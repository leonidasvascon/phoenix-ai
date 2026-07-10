import type { InstagramContainer, InstagramContainerStatusResponse, InstagramPublishResponse } from "./instagram-types.ts";

export class InstagramApiClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly accountId: string;

  constructor(options: { graphApiVersion: string; accessToken: string; instagramAccountId: string }) {
    this.baseUrl = `https://graph.facebook.com/${options.graphApiVersion}`;
    this.accessToken = options.accessToken;
    this.accountId = options.instagramAccountId;
  }

  async createReelContainer(input: {
    videoUrl: string;
    coverUrl?: string | null;
    caption: string;
  }): Promise<InstagramContainer> {
    const body = new URLSearchParams({
      access_token: this.accessToken,
      media_type: "REELS",
      video_url: input.videoUrl,
      caption: input.caption
    });

    if (input.coverUrl) {
      body.set("cover_url", input.coverUrl);
    }

    return this.post<InstagramContainer>(`/${this.accountId}/media`, body);
  }

  async getContainerStatus(containerId: string): Promise<InstagramContainerStatusResponse> {
    return this.get<InstagramContainerStatusResponse>(`/${containerId}?fields=status_code`);
  }

  async publishContainer(containerId: string): Promise<InstagramPublishResponse> {
    return this.post<InstagramPublishResponse>(
      `/${this.accountId}/media_publish`,
      new URLSearchParams({
        access_token: this.accessToken,
        creation_id: containerId
      })
    );
  }

  async getPublishingLimit(): Promise<unknown> {
    return this.get<unknown>(`/${this.accountId}/content_publishing_limit?fields=quota_usage,config`);
  }

  private async get<T>(path: string): Promise<T> {
    const separator = path.includes("?") ? "&" : "?";
    const response = await fetch(`${this.baseUrl}${path}${separator}access_token=${encodeURIComponent(this.accessToken)}`);

    return parseGraphResponse<T>(response);
  }

  private async post<T>(path: string, body: URLSearchParams): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      body
    });

    return parseGraphResponse<T>(response);
  }
}

async function parseGraphResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) as T & { error?: { message?: string; code?: string | number; type?: string } } : {} as T;

  if (!response.ok) {
    const message = payload.error?.message ?? `Meta Graph API request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}
