import type { GeneratedImage, ImageGenerationOptions } from "../types/assets.ts";

export interface ImageProvider {
  id: string;
  generate(prompt: string, options?: ImageGenerationOptions): Promise<GeneratedImage>;
}
