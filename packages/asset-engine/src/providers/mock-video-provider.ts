import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedVideo, VideoGenerationOptions } from "../types/assets.ts";
import type { VideoProvider } from "./video-provider.ts";

export class MockVideoProvider implements VideoProvider {
  readonly id = "mock";

  async generate(prompt: string, options: VideoGenerationOptions = {}): Promise<GeneratedVideo> {
    const outputPath = resolve(options.outputPath ?? "video.mp4");
    const placeholder = [
      "PHOENIX_AI_PLACEHOLDER_VIDEO",
      `provider=${this.id}`,
      `prompt=${prompt}`,
      `duration=${options.durationSeconds ?? 0}`
    ].join("\n");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, placeholder, "utf8");

    return {
      provider_id: this.id,
      path: outputPath,
      mime_type: "video/mp4",
      prompt,
      placeholder: true
    };
  }
}
