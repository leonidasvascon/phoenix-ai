import type { AssetProviderStatus } from "../types/assets.ts";
import type { ImageProvider } from "../providers/image-provider.ts";
import { OpenAIImageProvider } from "../providers/image/openai-image-provider.ts";
import { MockImageProvider } from "../providers/mock-image-provider.ts";
import { MockVideoProvider } from "../providers/mock-video-provider.ts";
import { MockVoiceProvider } from "../providers/mock-voice-provider.ts";
import { OpenAIVoiceProvider } from "../providers/voice/openai-voice-provider.ts";
import type { VideoProvider } from "../providers/video-provider.ts";
import type { VoiceProvider } from "../providers/voice-provider.ts";

export class AssetRegistry {
  readonly video: VideoProvider;
  readonly image: ImageProvider;
  readonly voice: VoiceProvider;

  constructor(options: { image?: ImageProvider; video?: VideoProvider; voice?: VoiceProvider } = {}) {
    this.video = options.video ?? new MockVideoProvider();
    this.image = options.image ?? new MockImageProvider();
    this.voice = options.voice ?? new MockVoiceProvider();
  }

  listProviders(): AssetProviderStatus[] {
    const imageProviderId = this.image.id === "openai" && !process.env.OPENAI_API_KEY ? "mock" : this.image.id;
    const requestedVoiceProvider = process.env.PHOENIX_VOICE_PROVIDER ?? "mock";
    const voiceCanUseOpenAI = Boolean(
      process.env.OPENAI_API_KEY &&
        process.env.PHOENIX_VOICE_MODEL?.trim() &&
        process.env.PHOENIX_VOICE_NAME?.trim()
    );
    const voiceProviderId = this.voice.id === "openai" && !voiceCanUseOpenAI ? "mock" : this.voice.id;
    const voiceFormat = process.env.PHOENIX_VOICE_FORMAT ?? "mp3";
    const voiceSpeed = Number(process.env.PHOENIX_VOICE_SPEED ?? 1);

    return [
      {
        id: this.video.id,
        kind: "video",
        status: "online",
        mode: this.video.id === "mock" ? "mock" : "production"
      },
      {
        id: imageProviderId,
        kind: "image",
        status: "online",
        mode: imageProviderId === "mock" ? "mock" : "production"
      },
      {
        id: voiceProviderId,
        kind: "voice",
        status: "online",
        mode: voiceProviderId === "mock" ? "mock" : "production",
        requested_provider: requestedVoiceProvider,
        effective_provider: voiceProviderId,
        fallback: requestedVoiceProvider !== voiceProviderId,
        model: voiceProviderId === "openai" ? process.env.PHOENIX_VOICE_MODEL ?? null : null,
        voice: voiceProviderId === "openai" ? process.env.PHOENIX_VOICE_NAME ?? null : null,
        format: voiceFormat,
        speed: Number.isFinite(voiceSpeed) ? voiceSpeed : 1
      }
    ];
  }
}

function createImageProvider(): ImageProvider {
  const provider = process.env.PHOENIX_IMAGE_PROVIDER ?? "mock";

  if (provider === "openai") {
    return new OpenAIImageProvider();
  }

  return new MockImageProvider();
}

function createVoiceProvider(): VoiceProvider {
  const provider = process.env.PHOENIX_VOICE_PROVIDER ?? "mock";

  if (provider === "openai") {
    return new OpenAIVoiceProvider();
  }

  return new MockVoiceProvider();
}

export function createDefaultAssetRegistry(): AssetRegistry {
  return new AssetRegistry({
    image: createImageProvider(),
    voice: createVoiceProvider()
  });
}
