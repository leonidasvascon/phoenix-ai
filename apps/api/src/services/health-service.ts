import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sanitizePhoenixEnv, validatePhoenixEnv } from "@phoenix-ai/config";
import { getVersionInfo } from "@phoenix-ai/version";
import { getProviderStatus } from "./provider-service.ts";
import { getLatestQualityReport } from "./quality-service.ts";
import { listScheduledJobs } from "./scheduled-job-service.ts";
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

export async function getHealthDetails() {
  const readiness = await getReadiness();
  const schedulerJobs = await listScheduledJobs().catch(() => []);
  const qualityReport = await getLatestQualityReport().catch(() => null);
  const providerStatus = getProviderStatus();
  const envValidation = validatePhoenixEnv();

  return {
    status: readiness.status === "ready" && envValidation.valid ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: getVersionInfo(),
    storage: readiness.checks.storage ? "ok" : "error",
    runtime_settings: readiness.checks.runtime_settings ? "ok" : "error",
    providers: providerStatus,
    scheduler: {
      worker_enabled: process.env.PHOENIX_SCHEDULER_WORKER === "true",
      total_jobs: Array.isArray(schedulerJobs) ? schedulerJobs.length : 0
    },
    publishing: {
      provider: process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock",
      dry_run: (process.env.PHOENIX_PUBLISHING_DRY_RUN ?? "true") !== "false"
    },
    observability: {
      enabled: (process.env.PHOENIX_OBSERVABILITY_ENABLED ?? "true") !== "false",
      service_name: process.env.PHOENIX_SERVICE_NAME ?? "phoenix-api"
    },
    evaluation: {
      latest_quality_status: qualityReport?.status ?? "unknown",
      latest_average_score: qualityReport?.average_score ?? null
    },
    config: {
      valid: envValidation.valid,
      mode: envValidation.mode,
      missing: envValidation.missing,
      values: sanitizePhoenixEnv()
    },
    errors: readiness.errors
  };
}
