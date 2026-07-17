import { getPhoenixEnvMode, readPhoenixEnv, type PhoenixEnv } from "./env.ts";
import { phoenixEnvSchema, type PhoenixEnvMode } from "./schema.ts";

export type PhoenixEnvValidation = {
  valid: boolean;
  mode: PhoenixEnvMode;
  missing: string[];
  values: Record<string, string | undefined>;
};

export function validatePhoenixEnv(env: PhoenixEnv = process.env): PhoenixEnvValidation {
  const mode = getPhoenixEnvMode(env);
  const values = readPhoenixEnv(env);
  const missing = phoenixEnvSchema
    .filter((item) => item.requiredIn.includes(mode))
    .filter((item) => !values[item.name])
    .map((item) => item.name);

  return { valid: missing.length === 0, mode, missing, values };
}

export function assertPhoenixEnv(env: PhoenixEnv = process.env): PhoenixEnvValidation {
  const validation = validatePhoenixEnv(env);
  if (!validation.valid) {
    throw new Error(`Missing required Phoenix environment variables: ${validation.missing.join(", ")}`);
  }
  return validation;
}
