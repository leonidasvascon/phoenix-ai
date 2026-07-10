import { randomUUID } from "node:crypto";
import { createDefaultPublishingProviderRegistry, type PublishingProviderRegistry } from "../registry/publishing-provider-registry.ts";
import { FilePublicationStore } from "../stores/file-publication-store.ts";
import type { PublicationStore } from "../stores/publication-store.ts";
import type { PublicationRequest, PublicationResult } from "../types/publication.ts";

export class PublishingService {
  private readonly registry: PublishingProviderRegistry;
  private readonly store: PublicationStore;

  constructor(
    registry = createDefaultPublishingProviderRegistry(),
    store: PublicationStore = new FilePublicationStore()
  ) {
    this.registry = registry;
    this.store = store;
  }

  list(): Promise<PublicationResult[]> {
    return this.store.list();
  }

  get(id: string): Promise<PublicationResult | null> {
    return this.store.get(id);
  }

  async createDraft(input: PublicationRequest): Promise<PublicationResult> {
    const providerId = input.provider ?? process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock";
    const provider = this.registry.get(input.platform, providerId);
    const existing = await this.store.findByExecutionPlatform(input.execution_id, input.platform);

    if (existing) {
      throw new Error(`Publication already exists for ${input.execution_id}/${input.platform}.`);
    }

    const request = normalizeRequest(input, providerId);
    const validation = await provider.validate(request);

    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    const now = new Date().toISOString();
    const publication: PublicationResult = {
      id: randomUUID(),
      execution_id: request.execution_id,
      platform: request.platform,
      requested_provider: providerId,
      effective_provider: provider.id,
      status: "validated",
      dry_run: request.dry_run ?? true,
      allow_fallback_assets: request.allow_fallback_assets ?? false,
      fallback_assets: validation.fallback_assets,
      format: request.format,
      caption: request.caption,
      hashtags: request.hashtags,
      media_path: request.media_path,
      thumbnail_path: request.thumbnail_path,
      metadata_path: request.metadata_path,
      assets_manifest_path: request.assets_manifest_path,
      scheduled_at: request.scheduled_at ?? null,
      created_at: now,
      updated_at: now,
      published_at: null,
      external_id: null,
      provider_data: {},
      validation,
      error: null
    };

    return this.store.save(publication);
  }

  async publish(id: string): Promise<PublicationResult> {
    const publication = await this.store.get(id);

    if (!publication) {
      throw new Error("Publication not found.");
    }

    if (publication.status === "published") {
      throw new Error("Publication already completed.");
    }

    if (publication.status === "cancelled") {
      throw new Error("Publication is cancelled.");
    }

    let current = await this.store.save({
      ...publication,
      status: "publishing",
      updated_at: new Date().toISOString()
    });

    const provider = this.registry.get(publication.platform, publication.requested_provider);
    let published: PublicationResult;

    try {
      published = await provider.publish({
        ...current,
        publication_id: current.id,
        provider_data: current.provider_data,
        allow_fallback_assets: publication.allow_fallback_assets,
        onStatusUpdate: async (update) => {
          current = await this.store.save({
            ...current,
            ...update,
            provider_data: {
              ...current.provider_data,
              ...update.provider_data
            },
            updated_at: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      const failed = await this.store.save({
        ...current,
        status: "failed",
        updated_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Publication failed."
      });

      return failed;
    }
    const result: PublicationResult = {
      ...current,
      effective_provider: published.effective_provider,
      status: published.status,
      updated_at: new Date().toISOString(),
      published_at: published.published_at,
      external_id: published.external_id,
      provider_data: {
        ...current.provider_data,
        ...published.provider_data
      },
      publishing_limit: published.publishing_limit ?? current.publishing_limit,
      validation: published.validation,
      fallback_assets: published.fallback_assets,
      error: published.error
    };

    return this.store.save(result);
  }

  async cancel(id: string): Promise<PublicationResult> {
    const publication = await this.store.get(id);

    if (!publication) {
      throw new Error("Publication not found.");
    }

    if (publication.status === "published") {
      throw new Error("Published publications cannot be cancelled.");
    }

    const now = new Date().toISOString();

    return this.store.save({
      ...publication,
      status: "cancelled",
      updated_at: now,
      cancelled_at: now
    });
  }
}

function normalizeRequest(input: PublicationRequest, providerId: string): PublicationRequest {
  return {
    ...input,
    provider: providerId,
    platform: input.platform || "instagram",
    hashtags: Array.isArray(input.hashtags) ? input.hashtags : [],
    dry_run: input.dry_run ?? (process.env.PHOENIX_PUBLISHING_DRY_RUN ?? "true") !== "false",
    allow_fallback_assets: input.allow_fallback_assets ?? process.env.PHOENIX_ALLOW_FALLBACK_ASSETS === "true"
  };
}
