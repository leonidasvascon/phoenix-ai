import { access, readFile } from "node:fs/promises";
import type { PublicationRequest, PublicationValidation } from "../types/publication.ts";

export class PublicationValidator {
  async validate(request: PublicationRequest): Promise<PublicationValidation> {
    const checks: PublicationValidation["checks"] = [];

    checks.push({
      name: "caption",
      passed: Boolean(request.caption.trim()),
      message: request.caption.trim() ? "Caption ready." : "Caption is required."
    });
    checks.push({
      name: "metadata",
      passed: Boolean(request.metadata_path) && await exists(request.metadata_path ?? ""),
      message: "Metadata file must exist."
    });
    checks.push({
      name: "video",
      passed: await exists(request.media_path),
      message: "Video file must exist."
    });
    checks.push({
      name: "thumbnail",
      passed: await exists(request.thumbnail_path),
      message: "Thumbnail file must exist."
    });

    const fallbackAssets = await hasFallbackAssets(request.assets_manifest_path);
    const allowFallback = request.allow_fallback_assets ?? false;

    checks.push({
      name: "fallback_assets",
      passed: !fallbackAssets || allowFallback,
      message: fallbackAssets
        ? "Package contains fallback assets."
        : "Package contains no fallback assets."
    });

    const errors = checks.filter((check) => !check.passed).map((check) => check.message);

    return {
      valid: errors.length === 0,
      fallback_assets: fallbackAssets,
      checks,
      errors
    };
  }
}

async function exists(path: string): Promise<boolean> {
  if (!path) return false;

  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function hasFallbackAssets(path: string | undefined): Promise<boolean> {
  if (!path) return false;

  try {
    const manifest = JSON.parse(await readFile(path, "utf8")) as Record<string, { fallback?: boolean; placeholder?: boolean }>;

    return Object.values(manifest).some((asset) => Boolean(asset?.fallback || asset?.placeholder));
  } catch {
    return false;
  }
}
