const blockedKeys = [
  "authorization",
  "api_key",
  "apikey",
  "access_token",
  "token",
  "secret",
  "password",
  "headers",
  "prompt",
  "raw_response",
  "openai_api_key",
  "meta_access_token",
  "phoenix_api_key",
  "clientsecret",
  "client_secret",
  "refreshtoken",
  "refresh_token",
  "idtoken",
  "id_token",
  "privatekey",
  "private_key",
  "masterkey",
  "master_key",
  "secretvalue",
  "credential",
  "cookie",
  "set_cookie"
];

const blockedValuePatterns = [
  /sk-[a-zA-Z0-9_-]{12,}/g,
  /phx_(live|test)_[a-zA-Z0-9_-]{12,}/g,
  /Bearer\s+[a-zA-Z0-9._-]+/g
];

export function sanitize(input: unknown): unknown {
  if (input && typeof input === "object" && "__phoenixSecretValue" in input) {
    return "[REDACTED]";
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitize(item));
  }

  if (input && typeof input === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (isBlockedKey(key)) {
        output[key] = "[REDACTED]";
        continue;
      }

      output[key] = sanitize(value);
    }

    return output;
  }

  if (typeof input === "string") {
    return blockedValuePatterns.reduce((value, pattern) => value.replace(pattern, "[REDACTED]"), input);
  }

  return input;
}

export function sanitizeAttributes(attributes: Record<string, unknown> = {}): Record<string, string | number | boolean | null> {
  const sanitized = sanitize(attributes) as Record<string, unknown>;
  const output: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      output[key] = value;
    }
  }

  return output;
}

function isBlockedKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-\s]/g, "_");

  return blockedKeys.some((blocked) => normalized.includes(blocked));
}
