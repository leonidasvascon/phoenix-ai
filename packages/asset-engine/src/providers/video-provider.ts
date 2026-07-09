import type { GeneratedVideo, VideoGenerationOptions } from "../types/assets.ts";

export interface VideoProvider {
  id: string;
  generate(prompt: string, options?: VideoGenerationOptions): Promise<GeneratedVideo>;
}
