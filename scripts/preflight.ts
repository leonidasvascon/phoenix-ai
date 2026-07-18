import { spawnSync } from "node:child_process";

type Step = {
  name: string;
  command: string;
  args: string[];
  optional?: boolean;
};

const packageManager = process.env.npm_execpath
  ? { command: process.execPath, prefixArgs: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "pnpm.cmd" : "pnpm", prefixArgs: [] };
const steps: Step[] = [
  { name: "integrity", command: packageManager.command, args: [...packageManager.prefixArgs, "run", "integrity:check"] },
  { name: "openapi", command: packageManager.command, args: [...packageManager.prefixArgs, "run", "openapi:validate"] },
  { name: "sdk", command: packageManager.command, args: [...packageManager.prefixArgs, "run", "sdk:build"] },
  { name: "quality", command: packageManager.command, args: [...packageManager.prefixArgs, "run", "quality:report"] },
  { name: "diagnostics", command: packageManager.command, args: [...packageManager.prefixArgs, "run", "diagnostics"] }
];

if (process.env.PHOENIX_RUN_AUDIT === "true") {
  steps.push({ name: "audit", command: packageManager.command, args: [...packageManager.prefixArgs, "audit"], optional: true });
}

const results = steps.map((step) => {
  const startedAt = performance.now();
  const result = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false
  });
  const passed = result.status === 0 || step.optional === true;
  return {
    name: step.name,
    status: passed ? "PASS" : "FAIL",
    exit_code: result.status,
    error: result.error?.message,
    duration_ms: Math.round(performance.now() - startedAt)
  };
});

const report = {
  status: results.every((item) => item.status === "PASS") ? "PASS" : "FAIL",
  generated_at: new Date().toISOString(),
  results
};

console.log(JSON.stringify(report, null, 2));
if (report.status !== "PASS") process.exitCode = 1;
