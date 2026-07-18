import type { EmbeddingRequest, EmbeddingResponse, GenerationRequest, GenerationResponse, ProviderCapabilities, ProviderHealth } from "./model-selection.ts";

export interface LanguageModelProvider {
  id: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  health(): Promise<ProviderHealth>;
  capabilities(): ProviderCapabilities;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, LanguageModelProvider>();

  register(provider: LanguageModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): LanguageModelProvider | undefined {
    return this.providers.get(id);
  }

  list(): LanguageModelProvider[] {
    return [...this.providers.values()];
  }
}

export function providerConfigured(providerId: string): boolean {
  if (providerId === "openai") return Boolean(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_REF);
  if (providerId === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);
  if (providerId === "google") return Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  if (providerId === "azure-openai") return Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
  if (providerId === "ollama") return Boolean(process.env.OLLAMA_BASE_URL);
  return false;
}
