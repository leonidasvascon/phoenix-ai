export type InstagramProviderConfig = {
  graphApiVersion: string | null;
  accessToken: string | null;
  instagramAccountId: string | null;
  dryRun: boolean;
  pollIntervalMs: number;
  timeoutMs: number;
};

export type InstagramContainerStatus = "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";

export type InstagramContainer = {
  id: string;
};

export type InstagramContainerStatusResponse = {
  id?: string;
  status_code?: InstagramContainerStatus | string;
};

export type InstagramPublishResponse = {
  id: string;
};

export type InstagramProviderStatus = {
  provider: "instagram";
  configured: boolean;
  account_id_present: boolean;
  access_token_present: boolean;
  graph_api_version_present: boolean;
  public_media_base_url_present: boolean;
  dry_run: boolean;
  ready: boolean;
};
