import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sanitizePhoenixEnv, validatePhoenixEnv } from "@phoenix-ai/config";
import { getVersionInfo } from "@phoenix-ai/version";

async function readOptionalJson(path: string): Promise<unknown | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(resolve(process.cwd(), path), "utf8")) as unknown;
  } catch {
    return null;
  }
}

async function main() {
  const report = {
    generated_at: new Date().toISOString(),
    version: getVersionInfo(),
    config: {
      validation: validatePhoenixEnv(),
      env: sanitizePhoenixEnv()
    },
    providers: {
      llm: process.env.PHOENIX_PROVIDER ?? "mock",
      image: process.env.PHOENIX_IMAGE_PROVIDER ?? "mock",
      voice: process.env.PHOENIX_VOICE_PROVIDER ?? "mock",
      video: process.env.PHOENIX_VIDEO_PROVIDER ?? "mock",
      publishing: process.env.PHOENIX_PUBLISHING_PROVIDER ?? "mock"
    },
    quality: await readOptionalJson("reports/quality-report.json"),
    observability: {
      enabled: (process.env.PHOENIX_OBSERVABILITY_ENABLED ?? "true") !== "false",
      service_name: process.env.PHOENIX_SERVICE_NAME ?? "phoenix-api"
    },
    scheduler: await readOptionalJson(".storage/scheduled-jobs.json")
  };

  await mkdir(resolve(process.cwd(), "reports"), { recursive: true });
  await writeFile(resolve(process.cwd(), "reports", "diagnostics.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ status: "success", file: "reports/diagnostics.json" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
