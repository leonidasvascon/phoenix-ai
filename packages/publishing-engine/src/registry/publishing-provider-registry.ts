import { MockPublishingProvider } from "../providers/mock-publishing-provider.ts";
import { InstagramPublishingProvider } from "../providers/instagram/instagram-publishing-provider.ts";
import type { PublishingProvider } from "../providers/publishing-provider.ts";

export class PublishingProviderRegistry {
  private readonly providers = new Map<string, PublishingProvider>();

  register(provider: PublishingProvider): void {
    this.providers.set(`${provider.platform}:${provider.id}`, provider);
  }

  get(platform: string, providerId: string): PublishingProvider {
    const provider = this.providers.get(`${platform}:${providerId}`);

    if (!provider) {
      throw new Error(`Publishing provider not found: ${platform}/${providerId}.`);
    }

    return provider;
  }

  list(): PublishingProvider[] {
    return [...this.providers.values()];
  }
}

export function createDefaultPublishingProviderRegistry(): PublishingProviderRegistry {
  const registry = new PublishingProviderRegistry();
  registry.register(new MockPublishingProvider("instagram"));
  registry.register(new InstagramPublishingProvider());
  return registry;
}
