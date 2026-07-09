import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedAudio, VoiceGenerationOptions } from "../types/assets.ts";
import type { VoiceProvider } from "./voice-provider.ts";

export class MockVoiceProvider implements VoiceProvider {
  readonly id = "mock";

  async synthesize(text: string, options: VoiceGenerationOptions = {}): Promise<GeneratedAudio> {
    const outputPath = resolve(options.outputPath ?? "narration.mp3");
    const placeholder = [
      "PHOENIX_AI_PLACEHOLDER_AUDIO",
      `provider=${this.id}`,
      `voice=${options.voice ?? "default"}`,
      `text=${text}`
    ].join("\n");

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, placeholder, "utf8");

    return {
      provider_id: this.id,
      path: outputPath,
      mime_type: "audio/mpeg",
      text,
      placeholder: true
    };
  }
}
