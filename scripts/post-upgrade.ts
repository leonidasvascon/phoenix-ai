import { spawnSync } from "node:child_process";

const packageManager = process.env.npm_execpath
  ? { command: process.execPath, prefixArgs: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "pnpm.cmd" : "pnpm", prefixArgs: [] };
const steps = [
  ["identity:migrate"],
  ["secrets:migrate"],
  ["integrity:check"],
  ["diagnostics"]
];

const results = steps.map(([script]) => {
  const result = spawnSync(packageManager.command, [...packageManager.prefixArgs, "run", script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false
  });
  return { script, status: result.status === 0 ? "PASS" : "FAIL", exit_code: result.status, error: result.error?.message };
});

const report = {
  status: results.every((item) => item.status === "PASS") ? "PASS" : "FAIL",
  checked_at: new Date().toISOString(),
  results
};

console.log(JSON.stringify(report, null, 2));
if (report.status !== "PASS") process.exitCode = 1;
