import type { AssetProviderStatus } from "../types/assets.ts";
import type { ImageProvider } from "../providers/image-provider.ts";
import { OpenAIImageProvider } from "../providers/image/openai-image-provider.ts";
import { MockImageProvider } from "../providers/mock-image-provider.ts";
import { MockVideoProvider } from "../providers/mock-video-provider.ts";
import { MockVoiceProvider } from "../providers/mock-voice-provider.ts";
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
        id: this.voice.id,
        kind: "voice",
        status: "online",
        mode: this.voice.id === "mock" ? "mock" : "production"
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

export function createDefaultAssetRegistry(): AssetRegistry {
  return new AssetRegistry({
    image: createImageProvider()
  });
}
