import { EncryptedFileSecretProvider } from "./providers/encrypted-file-provider.ts";
import { EnvironmentSecretProvider } from "./providers/environment-provider.ts";
import { MemorySecretProvider } from "./providers/memory-provider.ts";
import type { SecretProvider, SecretProviderName } from "./types.ts";

const memoryProvider = new MemorySecretProvider();

export function getSecretProvider(providerName: SecretProviderName): SecretProvider {
  if (providerName === "environment") return new EnvironmentSecretProvider();
  if (providerName === "encrypted_file") return new EncryptedFileSecretProvider();
  if (providerName === "memory") return memoryProvider;
  throw new Error(`Unsupported secret provider: ${providerName}`);
}

export function listSecretProviders(): SecretProvider[] {
  return [new EnvironmentSecretProvider(), new EncryptedFileSecretProvider(), memoryProvider];
}

export function defaultSecretProviderName(): SecretProviderName {
  const provider = process.env.PHOENIX_SECRETS_PROVIDER;
  if (provider === "environment" || provider === "encrypted_file" || provider === "memory") return provider;
  return "encrypted_file";
}
