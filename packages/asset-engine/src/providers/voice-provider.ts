import type { GeneratedAudio, VoiceGenerationOptions } from "../types/assets.ts";

export interface VoiceProvider {
  id: string;
  synthesize(text: string, options?: VoiceGenerationOptions): Promise<GeneratedAudio>;
}
