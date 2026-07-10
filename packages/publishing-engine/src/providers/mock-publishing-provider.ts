import { randomUUID } from "node:crypto";
import type { PublishingProvider } from "./publishing-provider.ts";
import { PublicationValidator } from "../services/publication-validator.ts";
import type { PublicationRequest, PublicationResult, PublicationValidation } from "../types/publication.ts";

export class MockPublishingProvider implements PublishingProvider {
  readonly id = "mock";
  readonly platform: string;
  private readonly validator: PublicationValidator;

  constructor(platform = "instagram", validator = new PublicationValidator()) {
    this.platform = platform;
    this.validator = validator;
  }

  validate(request: PublicationRequest): Promise<PublicationValidation> {
    return this.validator.validate(request);
  }

  async publish(request: PublicationRequest): Promise<PublicationResult> {
    const validation = await this.validate(request);
    const now = new Date().toISOString();

    return {
      id: randomUUID(),
      execution_id: request.execution_id,
      platform: request.platform,
      requested_provider: request.provider ?? this.id,
      effective_provider: this.id,
      status: validation.valid ? "published" : "failed",
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
      published_at: validation.valid ? now : null,
      external_id: validation.valid ? `mock-post-${randomUUID()}` : null,
      validation,
      error: validation.valid ? null : validation.errors.join("; ")
    };
  }

  async getStatus(publicationId: string): Promise<PublicationResult> {
    const now = new Date().toISOString();

    return {
      id: publicationId,
      execution_id: "",
      platform: this.platform,
      requested_provider: this.id,
      effective_provider: this.id,
      status: "published",
      dry_run: true,
      allow_fallback_assets: false,
      fallback_assets: false,
      format: "reel",
      caption: "",
      hashtags: [],
      media_path: "",
      thumbnail_path: "",
      created_at: now,
      updated_at: now,
      published_at: now,
      external_id: `mock-post-${publicationId}`,
      validation: {
        valid: true,
        fallback_assets: false,
        checks: [],
        errors: []
      },
      error: null
    };
  }
}
