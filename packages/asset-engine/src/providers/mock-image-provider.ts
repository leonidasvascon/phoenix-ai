import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedImage, ImageGenerationOptions } from "../types/assets.ts";
import type { ImageProvider } from "./image-provider.ts";

const placeholderPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

export class MockImageProvider implements ImageProvider {
  readonly id = "mock";

  async generate(prompt: string, options: ImageGenerationOptions = {}): Promise<GeneratedImage> {
    const outputPath = resolve(options.outputPath ?? "thumbnail.png");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, placeholderPng);

    return {
      provider_id: this.id,
      path: outputPath,
      mime_type: "image/png",
      prompt,
      placeholder: true
    };
  }
}
