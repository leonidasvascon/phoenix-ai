import { createDefaultAssetRegistry } from "@phoenix-ai/asset-engine";

export function listProviders() {
  return createDefaultAssetRegistry().listProviders();
}

export function getProviderStatus() {
  const providers = listProviders();

  return {
    status: providers.every((provider) => provider.status === "online") ? "online" : "degraded",
    providers
  };
}
