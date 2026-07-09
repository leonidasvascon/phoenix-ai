export { AssetRegistry, createDefaultAssetRegistry } from "./registry/provider-registry.ts";
export { AssetService } from "./services/asset-service.ts";
export type { ImageProvider } from "./providers/image-provider.ts";
export type { VideoProvider } from "./providers/video-provider.ts";
export type { VoiceProvider } from "./providers/voice-provider.ts";
export { MockImageProvider } from "./providers/mock-image-provider.ts";
export { MockVideoProvider } from "./providers/mock-video-provider.ts";
export { MockVoiceProvider } from "./providers/mock-voice-provider.ts";
export type {
  AssetGenerationInput,
  AssetProviderKind,
  AssetProviderStatus,
  GeneratedAssets,
  GeneratedAudio,
  GeneratedImage,
  GeneratedVideo,
  ImageGenerationOptions,
  VideoGenerationOptions,
  VoiceGenerationOptions
} from "./types/assets.ts";
