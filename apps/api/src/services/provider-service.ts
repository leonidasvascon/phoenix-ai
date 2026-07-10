import { createDefaultAssetRegistry } from "@phoenix-ai/asset-engine";

export function listProviders() {
  return [
    ...createDefaultAssetRegistry().listProviders(),
    {
      id: process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock",
      kind: "publishing",
      status: "online",
      mode: (process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock") === "mock" ? "mock" : "production",
      requested_provider: process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock",
      effective_provider: process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock",
      dry_run: (process.env.PHOENIX_PUBLISHING_DRY_RUN ?? "true") !== "false",
      allow_fallback_assets: process.env.PHOENIX_ALLOW_FALLBACK_ASSETS === "true"
    }
  ];
}

export function getProviderStatus() {
  const providers = listProviders();

  return {
    status: providers.every((provider) => provider.status === "online") ? "online" : "degraded",
    providers
  };
}
