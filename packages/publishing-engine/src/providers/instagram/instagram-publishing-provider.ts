import type { PublishableMediaResolver } from "../../media/publishable-media-resolver.ts";
import { PublicUrlMediaResolver } from "../../media/public-url-media-resolver.ts";
import { PublicationValidator } from "../../services/publication-validator.ts";
import type { PublishingProvider } from "../publishing-provider.ts";
import type { PublicationRequest, PublicationResult, PublicationValidation } from "../../types/publication.ts";
import { InstagramApiClient, sanitizeMetaError } from "./instagram-api-client.ts";
import { InstagramContainerPoller } from "./instagram-container-poller.ts";
import { InstagramPublishingLimit } from "./instagram-publishing-limit.ts";
import type { InstagramProviderConfig, InstagramProviderStatus } from "./instagram-types.ts";
import { resolveSecretValue } from "@phoenix-ai/secrets";

export class InstagramPublishingProvider implements PublishingProvider {
  readonly id = "instagram";
  readonly platform = "instagram";
  private readonly validator: PublicationValidator;
  private readonly mediaResolver: PublishableMediaResolver;

  constructor(
    options: {
      validator?: PublicationValidator;
      mediaResolver?: PublishableMediaResolver;
    } = {}
  ) {
    this.validator = options.validator ?? new PublicationValidator();
    this.mediaResolver = options.mediaResolver ?? new PublicUrlMediaResolver();
  }

  async validate(request: PublicationRequest): Promise<PublicationValidation> {
    const base = await this.validator.validate(request);
    const config = await readConfig();
    const checks = [...base.checks];
    const publicVideo = await resolvePublicMedia(this.mediaResolver, request.media_path);
    const publicThumbnail = await resolvePublicMedia(this.mediaResolver, request.thumbnail_path);

    checks.push({
      name: "instagram_account",
      passed: Boolean(config.instagramAccountId),
      message: config.instagramAccountId ? "Instagram account configured." : "META_INSTAGRAM_ACCOUNT_ID is required."
    });
    checks.push({
      name: "access_token",
      passed: Boolean(config.accessToken),
      message: config.accessToken ? "Meta access token configured." : "META_ACCESS_TOKEN is required."
    });
    checks.push({
      name: "graph_api_version",
      passed: Boolean(config.graphApiVersion),
      message: config.graphApiVersion ? "Graph API version configured." : "META_GRAPH_API_VERSION is required."
    });
    checks.push({
      name: "public_video_url",
      passed: Boolean(publicVideo.publicUrl),
      message: publicVideo.error ?? "Public video URL ready."
    });
    checks.push({
      name: "public_thumbnail_url",
      passed: Boolean(publicThumbnail.publicUrl),
      message: publicThumbnail.error ?? "Public thumbnail URL ready."
    });
    checks.push({
      name: "format",
      passed: request.format === "reel",
      message: request.format === "reel" ? "Instagram Reel format supported." : "Instagram provider v1 supports reel format only."
    });

    const errors = checks.filter((check) => !check.passed).map((check) => check.message);

    return {
      valid: errors.length === 0,
      fallback_assets: base.fallback_assets,
      checks,
      errors
    };
  }

  async publish(request: PublicationRequest): Promise<PublicationResult> {
    const validation = await this.validate(request);
    const now = new Date().toISOString();
    const config = await readConfig();
    const providerData = {
      container_id: request.provider_data?.container_id ?? null,
      container_status: request.provider_data?.container_status ?? null,
      public_video_url: request.provider_data?.public_video_url ?? null,
      public_thumbnail_url: request.provider_data?.public_thumbnail_url ?? null,
      instagram_media_id: request.provider_data?.instagram_media_id ?? null
    };

    if (!validation.valid) {
      return buildResult(request, {
        status: "failed",
        validation,
        providerData,
        error: validation.errors.join("; "),
        now
      });
    }

    const publicVideo = await this.mediaResolver.resolve(request.media_path);
    const publicThumbnail = await this.mediaResolver.resolve(request.thumbnail_path);
    providerData.public_video_url = publicVideo.publicUrl;
    providerData.public_thumbnail_url = publicThumbnail.publicUrl;

    if (config.dryRun) {
      const dryRunData = {
        ...providerData,
        container_id: providerData.container_id ?? `dry-run-container-${request.publication_id ?? "draft"}`,
        container_status: "DRY_RUN_READY",
        instagram_media_id: `dry-run-media-${request.publication_id ?? "draft"}`
      };

      await request.onStatusUpdate?.({
        status: "ready",
        provider_data: dryRunData
      });

      return buildResult(request, {
        status: "published",
        validation,
        providerData: dryRunData,
        externalId: dryRunData.instagram_media_id,
        publishedAt: now,
        now
      });
    }

    const client = new InstagramApiClient({
      graphApiVersion: config.graphApiVersion ?? "",
      accessToken: config.accessToken ?? "",
      instagramAccountId: config.instagramAccountId ?? ""
    });

    if (providerData.container_id && isFailedContainerStatus(providerData.container_status)) {
      throw new Error(`Persisted Instagram container cannot be reused because it is ${providerData.container_status}.`);
    }

    const limit = await new InstagramPublishingLimit(client).check();
    await request.onStatusUpdate?.({ publishing_limit: limit });

    if (!limit.available) {
      throw new Error(`Instagram publishing limit unavailable: ${limit.error ?? "unknown reason"}.`);
    }

    if (limit.remaining <= 0) {
      throw new Error("Instagram publishing limit reached for the current rolling window.");
    }

    if (!providerData.container_id) {
      const container = await client.createReelContainer({
        videoUrl: providerData.public_video_url,
        coverUrl: providerData.public_thumbnail_url,
        caption: formatCaption(request)
      });
      providerData.container_id = container.id;
      providerData.container_status = "IN_PROGRESS";
      await request.onStatusUpdate?.({
        status: "container_created",
        provider_data: providerData,
        publishing_limit: limit
      });
    }

    const poller = new InstagramContainerPoller(client, {
      pollIntervalMs: config.pollIntervalMs,
      timeoutMs: config.timeoutMs
    });

    await poller.waitUntilReady(providerData.container_id, async (status) => {
      providerData.container_status = status;
      await request.onStatusUpdate?.({
        status: status === "FINISHED" || status === "PUBLISHED" ? "ready" : "processing",
        provider_data: providerData,
        publishing_limit: limit
      });
    });

    const published = await client.publishContainer(providerData.container_id);
    providerData.instagram_media_id = published.id;
    providerData.container_status = "PUBLISHED";

    return buildResult(request, {
      status: "published",
      validation,
      providerData,
      publishingLimit: limit,
      externalId: published.id,
      publishedAt: new Date().toISOString(),
      now: new Date().toISOString()
    });
  }

  async getStatus(publicationId: string): Promise<PublicationResult> {
    const now = new Date().toISOString();

    return buildResult({
      execution_id: "",
      platform: this.platform,
      provider: this.id,
      format: "reel",
      caption: "",
      hashtags: [],
      media_path: "",
      thumbnail_path: "",
      dry_run: true,
      publication_id: publicationId
    }, {
      status: "validated",
      validation: {
        valid: true,
        fallback_assets: false,
        checks: [],
        errors: []
      },
      providerData: {},
      now
    });
  }
}

export async function validateInstagramProviderCredentials(): Promise<InstagramProviderStatus> {
  const status = getInstagramProviderStatus();

  if (!status.configured) {
    return status;
  }

  const config = await readConfig();

  try {
    const client = new InstagramApiClient({
      graphApiVersion: config.graphApiVersion ?? "",
      accessToken: config.accessToken ?? "",
      instagramAccountId: config.instagramAccountId ?? ""
    });
    await client.validateAccount();

    return {
      ...status,
      credentials_valid: true,
      ready: true,
      error: null
    };
  } catch (error) {
    return {
      ...status,
      credentials_valid: false,
      ready: false,
      error: error instanceof Error ? sanitizeMetaError(error.message) : "Instagram credentials validation failed."
    };
  }
}

export function getInstagramProviderStatus(): InstagramProviderStatus {
  const config = readConfigSync();
  const publicMediaBaseUrl = process.env.PHOENIX_PUBLIC_MEDIA_BASE_URL ?? "";
  const publicBaseUrlValid = isValidPublicHttpsUrl(publicMediaBaseUrl);
  const configured = Boolean(config.instagramAccountId && config.accessToken && config.graphApiVersion && publicBaseUrlValid);

  return {
    provider: "instagram",
    configured,
    credentials_valid: false,
    account_id_present: Boolean(config.instagramAccountId),
    access_token_present: Boolean(config.accessToken),
    graph_api_version_present: Boolean(config.graphApiVersion),
    public_media_base_url_present: publicBaseUrlValid,
    dry_run: config.dryRun,
    ready: false,
    error: configured ? null : "Instagram provider is not fully configured."
  };
}

async function readConfig(): Promise<InstagramProviderConfig> {
  const accessToken = await resolveMetaAccessToken();
  return {
    graphApiVersion: process.env.META_GRAPH_API_VERSION ?? null,
    accessToken,
    instagramAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID ?? null,
    dryRun: (process.env.PHOENIX_PUBLISHING_DRY_RUN ?? "true") !== "false",
    pollIntervalMs: Number(process.env.PHOENIX_INSTAGRAM_POLL_INTERVAL_MS ?? 5000),
    timeoutMs: Number(process.env.PHOENIX_INSTAGRAM_TIMEOUT_MS ?? 300000)
  };
}

function readConfigSync(): InstagramProviderConfig {
  return {
    graphApiVersion: process.env.META_GRAPH_API_VERSION ?? null,
    accessToken: process.env.META_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN_REF ?? null,
    instagramAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID ?? null,
    dryRun: (process.env.PHOENIX_PUBLISHING_DRY_RUN ?? "true") !== "false",
    pollIntervalMs: Number(process.env.PHOENIX_INSTAGRAM_POLL_INTERVAL_MS ?? 5000),
    timeoutMs: Number(process.env.PHOENIX_INSTAGRAM_TIMEOUT_MS ?? 300000)
  };
}

async function resolveMetaAccessToken(): Promise<string | null> {
  const reference = process.env.META_ACCESS_TOKEN_REF;
  if (!reference) return process.env.META_ACCESS_TOKEN ?? null;
  return resolveSecretValue(reference, {
    workspaceId: process.env.PHOENIX_WORKSPACE_ID ?? "default-workspace",
    actorType: "system",
    actorId: "publishing-engine",
    resource: "publishing.instagram",
    action: "read",
    traceId: "publishing-engine"
  }).catch(() => process.env.META_ACCESS_TOKEN ?? null);
}

async function resolvePublicMedia(resolver: PublishableMediaResolver, localPath: string): Promise<{ publicUrl?: string; error?: string }> {
  try {
    const media = await resolver.resolve(localPath);
    return { publicUrl: media.publicUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Media cannot be resolved to a public URL." };
  }
}

function formatCaption(request: PublicationRequest): string {
  const hashtags = request.hashtags.map((tag) => tag.startsWith("#") ? tag : `#${tag}`);
  return [request.caption, hashtags.join(" ")].filter(Boolean).join("\n\n");
}

function isFailedContainerStatus(status: string | null | undefined): boolean {
  return status === "ERROR" || status === "EXPIRED" || status === "FAILED";
}

function isValidPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function buildResult(
  request: PublicationRequest,
  input: {
    status: PublicationResult["status"];
    validation: PublicationValidation;
    providerData: PublicationResult["provider_data"];
    publishingLimit?: PublicationResult["publishing_limit"];
    externalId?: string | null;
    publishedAt?: string | null;
    error?: string | null;
    now: string;
  }
): PublicationResult {
  return {
    id: request.publication_id ?? "",
    execution_id: request.execution_id,
    platform: request.platform,
    requested_provider: request.provider ?? "instagram",
    effective_provider: "instagram",
    status: input.status,
    dry_run: request.dry_run ?? true,
    allow_fallback_assets: request.allow_fallback_assets ?? false,
    fallback_assets: input.validation.fallback_assets,
    format: request.format,
    caption: request.caption,
    hashtags: request.hashtags,
    media_path: request.media_path,
    thumbnail_path: request.thumbnail_path,
    metadata_path: request.metadata_path,
    assets_manifest_path: request.assets_manifest_path,
    scheduled_at: request.scheduled_at ?? null,
    created_at: input.now,
    updated_at: input.now,
    published_at: input.publishedAt ?? null,
    external_id: input.externalId ?? null,
    provider_data: input.providerData,
    publishing_limit: input.publishingLimit,
    validation: input.validation,
    error: input.error ?? null
  };
}
