export type AssetProviderKind = "image" | "video" | "voice";

export type AssetProviderStatus = {
  id: string;
  kind: AssetProviderKind;
  status: "offline" | "online";
  mode: "mock" | "production";
  requested_provider?: string;
  effective_provider?: string;
  fallback?: boolean;
  model?: string | null;
  voice?: string | null;
  format?: string;
  speed?: number;
};

export type ImageGenerationOptions = {
  outputPath?: string;
  requestedProvider?: string;
  size?: string;
  width?: number;
  height?: number;
};

export type VideoGenerationOptions = {
  outputPath?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
};

export type VoiceGenerationOptions = {
  outputPath?: string;
  requestedProvider?: string;
  model?: string | null;
  format?: string;
  voice?: string;
  speed?: number;
};

export type GeneratedImage = {
  provider_id: string;
  requested_provider?: string;
  path: string;
  mime_type: "image/png";
  prompt: string;
  placeholder: boolean;
  fallback?: boolean;
  model?: string;
  size?: string;
};

export type GeneratedVideo = {
  provider_id: string;
  path: string;
  mime_type: "video/mp4";
  prompt: string;
  placeholder: boolean;
};

export type GeneratedAudio = {
  provider_id: string;
  requested_provider?: string;
  path: string;
  mime_type: "audio/mpeg";
  text: string;
  placeholder: boolean;
  fallback?: boolean;
  model?: string | null;
  voice?: string | null;
  format?: string;
  speed?: number;
};

export type GeneratedAssets = {
  directory: string;
  image: GeneratedImage;
  voice: GeneratedAudio;
  video: GeneratedVideo;
};

export type AssetGenerationInput = {
  outputDirectory: string;
  thumbnailPrompt: string;
  videoPrompt: string;
  narrationText: string;
};
