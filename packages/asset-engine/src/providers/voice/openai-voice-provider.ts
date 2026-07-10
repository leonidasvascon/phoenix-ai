import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedAudio, VoiceGenerationOptions } from "../../types/assets.ts";
import type { VoiceProvider } from "../voice-provider.ts";
import { MockVoiceProvider } from "../mock-voice-provider.ts";

const acceptedFormats = new Set(["mp3", "opus", "aac", "flac", "wav", "pcm"]);

export class OpenAIVoiceProvider implements VoiceProvider {
  readonly id = "openai";
  private readonly apiKey: string;
  private readonly fallback: MockVoiceProvider;

  constructor(options: { apiKey?: string; fallback?: MockVoiceProvider } = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.fallback = options.fallback ?? new MockVoiceProvider();
  }

  async synthesize(text: string, options: VoiceGenerationOptions = {}): Promise<GeneratedAudio> {
    const config = this.readConfig(options);
    const validation = this.validateConfig(config);

    if (validation) {
      return this.generateFallback(text, config, validation);
    }

    const outputPath = resolve(options.outputPath ?? `narration.${config.format}`);

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          input: text,
          voice: config.voice,
          response_format: config.format,
          speed: config.speed
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const audio = Buffer.from(await response.arrayBuffer());

      if (audio.length === 0) {
        throw new Error("OpenAI voice response was empty.");
      }

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, audio);

      return {
        provider_id: this.id,
        requested_provider: config.requestedProvider,
        path: outputPath,
        mime_type: "audio/mpeg",
        text,
        placeholder: false,
        fallback: false,
        model: config.model,
        voice: config.voice,
        format: config.format,
        speed: config.speed
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown OpenAI voice generation error.";
      return this.generateFallback(text, config, reason);
    }
  }

  private readConfig(options: VoiceGenerationOptions) {
    return {
      requestedProvider: options.requestedProvider ?? this.id,
      model: options.model ?? process.env.PHOENIX_VOICE_MODEL ?? null,
      voice: options.voice ?? process.env.PHOENIX_VOICE_NAME ?? null,
      format: options.format ?? process.env.PHOENIX_VOICE_FORMAT ?? "mp3",
      outputPath: options.outputPath,
      speed: options.speed ?? Number(process.env.PHOENIX_VOICE_SPEED ?? 1)
    };
  }

  private validateConfig(config: ReturnType<OpenAIVoiceProvider["readConfig"]>): string | null {
    if (!this.apiKey) return "OPENAI_API_KEY is required.";
    if (!config.model?.trim()) return "PHOENIX_VOICE_MODEL is required.";
    if (!config.voice?.trim()) return "PHOENIX_VOICE_NAME is required.";
    if (!acceptedFormats.has(config.format)) return `Unsupported voice format: ${config.format}.`;
    if (!Number.isFinite(config.speed) || config.speed < 0.25 || config.speed > 4) {
      return "PHOENIX_VOICE_SPEED must be between 0.25 and 4.";
    }

    return null;
  }

  private generateFallback(
    text: string,
    config: ReturnType<OpenAIVoiceProvider["readConfig"]>,
    reason: string
  ): Promise<GeneratedAudio> {
    return this.fallback.synthesize(text, {
      outputPath: config.outputPath,
      requestedProvider: this.id,
      model: null,
      voice: null,
      format: config.format,
      speed: config.speed,
      failureReason: reason
    });
  }
}
