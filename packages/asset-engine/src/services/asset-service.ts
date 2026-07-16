import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetGenerationInput, GeneratedAssets } from "../types/assets.ts";
import { AssetRegistry, createDefaultAssetRegistry } from "../registry/provider-registry.ts";
import { VideoGenerationService } from "./video-generation-service.ts";
import { incrementCounter, withSpan } from "@phoenix-ai/observability";

export class AssetService {
  private readonly registry: AssetRegistry;

  constructor(registry = createDefaultAssetRegistry()) {
    this.registry = registry;
  }

  async generate(input: AssetGenerationInput): Promise<GeneratedAssets> {
    return withSpan("phoenix.asset.generate", {
      "phoenix.execution.id": input.executionId,
      "phoenix.provider.requested": `${this.registry.image.id},${this.registry.voice.id},${this.registry.video.id}`
    }, async () => this.generateWithSpan(input));
  }

  private async generateWithSpan(input: AssetGenerationInput): Promise<GeneratedAssets> {
    const assetsDirectory = join(input.outputDirectory, "assets");

    await mkdir(assetsDirectory, { recursive: true });

    const [image, voice, video] = await Promise.all([
      this.registry.image.generate(input.thumbnailPrompt, {
        outputPath: join(assetsDirectory, "thumbnail.png"),
        requestedProvider: this.registry.image.id,
        size: process.env.PHOENIX_IMAGE_SIZE ?? "1024x1024"
      }),
      this.registry.voice.synthesize(input.narrationText, {
        outputPath: join(assetsDirectory, "narration.mp3"),
        requestedProvider: this.registry.voice.id,
        model: process.env.PHOENIX_VOICE_MODEL ?? null,
        voice: process.env.PHOENIX_VOICE_NAME,
        format: process.env.PHOENIX_VOICE_FORMAT ?? "mp3",
        speed: Number(process.env.PHOENIX_VOICE_SPEED ?? 1)
      }),
      new VideoGenerationService(this.registry.video).generate(input.videoPrompt, join(assetsDirectory, "video.mp4"), {
        executionId: input.executionId,
        requestedProvider: this.registry.video.id,
        model: process.env.PHOENIX_VIDEO_MODEL ?? null,
        size: process.env.PHOENIX_VIDEO_SIZE ?? "1080x1920",
        durationSeconds: Number(process.env.PHOENIX_VIDEO_DURATION_SECONDS ?? 8),
        pollIntervalMs: Number(process.env.PHOENIX_VIDEO_POLL_INTERVAL_MS ?? 5000),
        timeoutMs: Number(process.env.PHOENIX_VIDEO_TIMEOUT_MS ?? 600000)
      })
    ]);

    const generatedAssets: GeneratedAssets = {
      directory: assetsDirectory,
      image,
      voice,
      video
    };

    for (const [kind, asset] of Object.entries({ image, voice, video })) {
      if (asset.fallback) {
        incrementCounter("phoenix_provider_fallbacks_total", {
          provider: asset.requested_provider ?? asset.provider_id,
          kind,
          result: "fallback"
        });
      }
    }

    await writeFile(join(assetsDirectory, "assets.json"), JSON.stringify(generatedAssets, null, 2), "utf8");

    return generatedAssets;
  }
}
