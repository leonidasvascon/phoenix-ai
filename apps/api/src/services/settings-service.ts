import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type RuntimeSettings = {
  phoenix_provider: string;
  phoenix_api_url: string;
  quality_min_score: number;
  max_attempts: number;
  output_root: string;
};

type RuntimeSettingsInput = Partial<Record<keyof RuntimeSettings, unknown>>;

function getSettingsPath(): string {
  return resolve(process.cwd(), ".storage", "settings.json");
}

export function defaultRuntimeSettings(): RuntimeSettings {
  const apiPort = process.env.PHOENIX_API_PORT ?? "4000";

  return {
    phoenix_provider: process.env.PHOENIX_PROVIDER ?? "mock",
    phoenix_api_url: process.env.PHOENIX_API_URL ?? `http://127.0.0.1:${apiPort}`,
    quality_min_score: 90,
    max_attempts: 2,
    output_root: "output"
  };
}

export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  try {
    const source = await readFile(getSettingsPath(), "utf8");
    return normalizeSettings(JSON.parse(source) as RuntimeSettingsInput);
  } catch {
    return defaultRuntimeSettings();
  }
}

export async function updateRuntimeSettings(input: RuntimeSettingsInput): Promise<RuntimeSettings> {
  const current = await getRuntimeSettings();
  const settings = normalizeSettings({
    ...current,
    ...input
  });
  const settingsPath = getSettingsPath();

  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  return settings;
}

function normalizeSettings(input: RuntimeSettingsInput): RuntimeSettings {
  const defaults = defaultRuntimeSettings();
  const provider = readString(input.phoenix_provider, defaults.phoenix_provider);

  return {
    phoenix_provider: provider === "openai" ? "openai" : "mock",
    phoenix_api_url: readString(input.phoenix_api_url, defaults.phoenix_api_url),
    quality_min_score: clampNumber(input.quality_min_score, defaults.quality_min_score, 0, 100),
    max_attempts: clampNumber(input.max_attempts, defaults.max_attempts, 1, 5),
    output_root: readString(input.output_root, defaults.output_root)
  };
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}
