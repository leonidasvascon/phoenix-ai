import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetGenerationInput, GeneratedAssets } from "../types/assets.ts";
import { AssetRegistry, createDefaultAssetRegistry } from "../registry/provider-registry.ts";

export class AssetService {
  private readonly registry: AssetRegistry;

  constructor(registry = createDefaultAssetRegistry()) {
    this.registry = registry;
  }

  async generate(input: AssetGenerationInput): Promise<GeneratedAssets> {
    const assetsDirectory = join(input.outputDirectory, "assets");

    await mkdir(assetsDirectory, { recursive: true });

    const [image, voice, video] = await Promise.all([
      this.registry.image.generate(input.thumbnailPrompt, {
        outputPath: join(assetsDirectory, "thumbnail.png"),
        requestedProvider: this.registry.image.id,
        size: process.env.PHOENIX_IMAGE_SIZE ?? "1024x1024"
      }),
      this.registry.voice.synthesize(input.narrationText, {
        outputPath: join(assetsDirectory, "narration.mp3")
      }),
      this.registry.video.generate(input.videoPrompt, {
        outputPath: join(assetsDirectory, "video.mp4")
      })
    ]);

    const generatedAssets: GeneratedAssets = {
      directory: assetsDirectory,
      image,
      voice,
      video
    };

    await writeFile(join(assetsDirectory, "assets.json"), JSON.stringify(generatedAssets, null, 2), "utf8");

    return generatedAssets;
  }
}
