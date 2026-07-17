import { phoenixEnvSchema, type PhoenixEnvMode } from "./schema.ts";

export type PhoenixEnv = Record<string, string | undefined>;

export function getPhoenixEnvMode(env: PhoenixEnv = process.env): PhoenixEnvMode {
  const value = (env.PHOENIX_ENV ?? env.NODE_ENV ?? "development").toLowerCase();
  return value === "production" || value === "test" ? value : "development";
}

export function readPhoenixEnv(env: PhoenixEnv = process.env): Record<string, string | undefined> {
  return Object.fromEntries(phoenixEnvSchema.map((item) => [item.name, env[item.name] ?? item.defaultValue]));
}

export function sanitizePhoenixEnv(env: PhoenixEnv = process.env): Record<string, string | undefined> {
  return Object.fromEntries(
    phoenixEnvSchema.map((item) => {
      const value = env[item.name] ?? item.defaultValue;
      return [item.name, item.sensitive && value ? "[redacted]" : value];
    })
  );
}
