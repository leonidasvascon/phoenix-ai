import { resolve } from "node:path";
import { eventBus } from "@phoenix-ai/event-bus";
import { PublishingService, type PublicationRequest } from "@phoenix-ai/publishing-engine";
import { getExecutionPackage } from "./runtime-service.ts";

type CreatePublicationInput = Partial<PublicationRequest> & {
  execution_id?: unknown;
};

const publishingService = new PublishingService();

export function listPublications() {
  return publishingService.list();
}

export function getPublication(id: string) {
  return publishingService.get(id);
}

export async function createPublication(input: unknown) {
  const payload = normalizeCreatePublicationInput(input);
  const executionPackage = await getExecutionPackage(payload.execution_id);

  if (!executionPackage?.execution.media_package) {
    throw new Error("Execution package not found.");
  }

  const packageDirectory = resolve(process.cwd(), executionPackage.execution.media_package.directory);
  const request: PublicationRequest = {
    execution_id: payload.execution_id,
    platform: payload.platform ?? executionPackage.execution.execution.task?.platform ?? "instagram",
    provider: payload.provider ?? process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock",
    format: payload.format ?? executionPackage.execution.execution.task?.format ?? "reel",
    caption: payload.caption ?? readFileText(executionPackage.files["legenda.txt"]),
    hashtags: payload.hashtags ?? readHashtags(executionPackage.files["hashtags.txt"]),
    media_path: payload.media_path ?? resolve(packageDirectory, "assets", "video.mp4"),
    thumbnail_path: payload.thumbnail_path ?? resolve(packageDirectory, "assets", "thumbnail.png"),
    metadata_path: payload.metadata_path ?? resolve(packageDirectory, "metadata.json"),
    assets_manifest_path: payload.assets_manifest_path ?? resolve(packageDirectory, "assets", "assets.json"),
    scheduled_at: payload.scheduled_at ?? null,
    dry_run: payload.dry_run ?? (process.env.PHOENIX_PUBLISHING_DRY_RUN ?? "true") !== "false",
    allow_fallback_assets: payload.allow_fallback_assets ?? process.env.PHOENIX_ALLOW_FALLBACK_ASSETS === "true"
  };

  const publication = await publishingService.createDraft(request);
  await eventBus.publish({
    type: "publication.started",
    origin: "publication-service",
    payload: { publication_id: publication.id, execution_id: publication.execution_id, platform: publication.platform, status: publication.status }
  });

  return publication;
}

export async function publishPublication(id: string) {
  try {
    const publication = await publishingService.publish(id);
    await eventBus.publish({
      type: publication.status === "published" ? "publication.completed" : "publication.failed",
      origin: "publication-service",
      payload: { publication_id: publication.id, execution_id: publication.execution_id, platform: publication.platform, status: publication.status, error: publication.error }
    });
    return publication;
  } catch (error) {
    await eventBus.publish({
      type: "publication.failed",
      origin: "publication-service",
      payload: { publication_id: id, error: error instanceof Error ? error.message : "Publication failed." }
    });
    throw error;
  }
}

export function cancelPublication(id: string) {
  return publishingService.cancel(id);
}

function normalizeCreatePublicationInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Publication payload is required.");
  }

  const payload = input as CreatePublicationInput;
  const executionId = typeof payload.execution_id === "string" ? payload.execution_id.trim() : "";

  if (!executionId) {
    throw new Error("execution_id is required.");
  }

  return {
    execution_id: executionId,
    platform: stringOrUndefined(payload.platform),
    provider: stringOrUndefined(payload.provider),
    format: stringOrUndefined(payload.format),
    caption: stringOrUndefined(payload.caption),
    hashtags: Array.isArray(payload.hashtags) ? payload.hashtags.map((item) => String(item).trim()).filter(Boolean) : undefined,
    media_path: stringOrUndefined(payload.media_path),
    thumbnail_path: stringOrUndefined(payload.thumbnail_path),
    metadata_path: stringOrUndefined(payload.metadata_path),
    assets_manifest_path: stringOrUndefined(payload.assets_manifest_path),
    scheduled_at: stringOrNull(payload.scheduled_at),
    dry_run: typeof payload.dry_run === "boolean" ? payload.dry_run : undefined,
    allow_fallback_assets: typeof payload.allow_fallback_assets === "boolean" ? payload.allow_fallback_assets : undefined
  };
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringOrNull(value: unknown): string | null | undefined {
  if (value === null) return null;
  return stringOrUndefined(value);
}

function readFileText(source: string | undefined): string {
  return source?.trim() ?? "";
}

function readHashtags(source: string | undefined): string[] {
  return (source ?? "")
    .split(/\s+/)
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean);
}
