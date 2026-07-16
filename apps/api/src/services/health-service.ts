import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getRuntimeSettings } from "./settings-service.ts";

export async function getLiveness() {
  return {
    status: "ok",
    service: "phoenix-api",
    timestamp: new Date().toISOString()
  };
}

export async function getReadiness() {
  const checks = {
    storage: false,
    runtime_settings: false,
    cwd: process.cwd()
  };
  const errors: string[] = [];

  try {
    const healthDirectory = resolve(process.cwd(), ".storage", "health");
    await mkdir(healthDirectory, { recursive: true });
    await writeFile(resolve(healthDirectory, "ready.txt"), new Date().toISOString(), "utf8");
    checks.storage = true;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Storage check failed.");
  }

  try {
    await getRuntimeSettings();
    checks.runtime_settings = true;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Runtime settings check failed.");
  }

  return {
    status: errors.length === 0 ? "ready" : "not_ready",
    checks,
    errors
  };
}
