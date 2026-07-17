import type { SecretValue } from "./types.ts";

const sensitiveKeys = [
  "apiKey", "api_key", "apikey", "clientSecret", "client_secret", "accessToken", "access_token",
  "refreshToken", "refresh_token", "idToken", "id_token", "privateKey", "private_key",
  "masterKey", "master_key", "secretValue", "credential", "cookie", "set-cookie", "authorization",
  "value", "plaintext", "ciphertext"
];

const knownValues = new Set<string>();

export function registerKnownSecretValue(value: string): void {
  if (value && value.length >= 4) knownValues.add(value);
}

export function sanitizeSecretPayload(input: unknown): unknown {
  if (isSecretValue(input)) return "[REDACTED]";
  if (Array.isArray(input)) return input.map(sanitizeSecretPayload);
  if (input && typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      output[key] = isSensitiveKey(key) ? "[REDACTED]" : sanitizeSecretPayload(value);
    }
    return output;
  }
  if (typeof input === "string") {
    let value = input
      .replace(/sk-[a-zA-Z0-9_-]{12,}/g, "[REDACTED]")
      .replace(/phx_(live|test)_[a-zA-Z0-9_-]{12,}/g, "[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "Bearer [REDACTED]");
    for (const secret of knownValues) value = value.split(secret).join("[REDACTED]");
    return value;
  }
  return input;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-\s]/g, "_");
  return sensitiveKeys.some((item) => normalized.includes(item.toLowerCase().replace(/[-\s]/g, "_")));
}

function isSecretValue(value: unknown): value is SecretValue {
  return Boolean(value && typeof value === "object" && "__phoenixSecretValue" in value);
}
