import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { GeneratedImage, ImageGenerationOptions } from "../../types/assets.ts";
import type { ImageProvider } from "../image-provider.ts";
import { MockImageProvider } from "../mock-image-provider.ts";
import { resolveSecretValue } from "@phoenix-ai/secrets";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
};

export class OpenAIImageProvider implements ImageProvider {
  readonly id = "openai";
  private readonly apiKey: string;
  private readonly fallback: MockImageProvider;
  private readonly model: string;

  constructor(options: { apiKey?: string; fallback?: MockImageProvider; model?: string } = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.fallback = options.fallback ?? new MockImageProvider();
    this.model = options.model ?? process.env.PHOENIX_IMAGE_MODEL ?? "gpt-image-1";
  }

  async generate(prompt: string, options: ImageGenerationOptions = {}): Promise<GeneratedImage> {
    const size = options.size ?? process.env.PHOENIX_IMAGE_SIZE ?? "1024x1024";

    const apiKey = await resolveOpenAiApiKey(this.apiKey);
    if (!apiKey) {
      return this.generateFallback(prompt, options, size);
    }

    try {
      const outputPath = resolve(options.outputPath ?? "thumbnail.png");
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          size,
          n: 1
        })
      });
      const payload = (await response.json()) as OpenAIImageResponse;

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `OpenAI image request failed with ${response.status}.`);
      }

      const base64 = payload.data?.[0]?.b64_json;

      if (!base64) {
        throw new Error("OpenAI image response did not include b64_json.");
      }

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, Buffer.from(base64, "base64"));

      return {
        provider_id: this.id,
        requested_provider: options.requestedProvider ?? this.id,
        path: outputPath,
        mime_type: "image/png",
        prompt,
        placeholder: false,
        fallback: false,
        model: this.model,
        size
      };
    } catch {
      return this.generateFallback(prompt, options, size);
    }
  }

  private generateFallback(prompt: string, options: ImageGenerationOptions, size: string): Promise<GeneratedImage> {
    return this.fallback.generate(prompt, {
      ...options,
      requestedProvider: this.id,
      size
    });
  }
}

async function resolveOpenAiApiKey(fallback: string): Promise<string> {
  const reference = process.env.OPENAI_API_KEY_REF;
  if (!reference) return fallback;
  return resolveSecretValue(reference, {
    workspaceId: process.env.PHOENIX_WORKSPACE_ID ?? "default-workspace",
    actorType: "system",
    actorId: "asset-engine",
    resource: "providers.openai",
    action: "read",
    traceId: "asset-engine"
  }).catch(() => fallback);
}
