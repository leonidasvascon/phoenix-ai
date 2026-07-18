import type { CostUsageKind, PricingEntry, TokenUsageInput } from "./types.ts";

export function calculateCost(input: {
  pricing: PricingEntry;
  kind: CostUsageKind;
  tokens: TokenUsageInput;
  images?: number;
  audio_seconds?: number;
  video_seconds?: number;
}): number {
  const tokenCost = ((input.tokens.input / 1000) * input.pricing.input_per_1k) + ((input.tokens.output / 1000) * input.pricing.output_per_1k);
  const embeddingCost = (((input.tokens.embeddings ?? 0) / 1000) * input.pricing.embedding_per_1k);
  const imageCost = (input.images ?? 0) * input.pricing.image_unit;
  const audioCost = ((input.audio_seconds ?? 0) / 60) * input.pricing.audio_per_minute;
  const videoCost = (input.video_seconds ?? 0) * input.pricing.video_per_second;
  return Number((tokenCost + embeddingCost + imageCost + audioCost + videoCost).toFixed(6));
}
