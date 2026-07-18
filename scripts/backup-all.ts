import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/backup.ts"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});

process.exitCode = result.status ?? 1;
