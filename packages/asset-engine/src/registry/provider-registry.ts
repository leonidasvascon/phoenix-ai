import type { AssetProviderStatus } from "../types/assets.ts";
import type { ImageProvider } from "../providers/image-provider.ts";
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
    return [
      {
        id: this.video.id,
        kind: "video",
        status: "online",
        mode: this.video.id === "mock" ? "mock" : "production"
      },
      {
        id: this.image.id,
        kind: "image",
        status: "online",
        mode: this.image.id === "mock" ? "mock" : "production"
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

export function createDefaultAssetRegistry(): AssetRegistry {
  return new AssetRegistry();
}
