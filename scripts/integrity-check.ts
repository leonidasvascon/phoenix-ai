import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

type IntegrityIssue = {
  path: string;
  message: string;
};

const jsonRoots = [".storage", "reports"];
const requiredPaths = ["prompts/brands", ".storage", "output"];

async function scanJsonFiles(directory: string, issues: IntegrityIssue[]): Promise<void> {
  if (!existsSync(directory)) {
    return;
  }

  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = join(directory, entry.name);

    if (entry.isDirectory()) {
      await scanJsonFiles(absolute, issues);
      continue;
    }

    if (!entry.name.endsWith(".json")) {
      continue;
    }

    try {
      JSON.parse(await readFile(absolute, "utf8"));
    } catch (error) {
      issues.push({
        path: relative(process.cwd(), absolute).replaceAll("\\", "/"),
        message: error instanceof Error ? error.message : "Invalid JSON."
      });
    }
  }
}

async function main() {
  const issues: IntegrityIssue[] = [];
  const warnings: IntegrityIssue[] = [];

  for (const requiredPath of requiredPaths) {
    if (!existsSync(resolve(process.cwd(), requiredPath))) {
      warnings.push({ path: requiredPath, message: "Path not found." });
    }
  }

  for (const root of jsonRoots) {
    await scanJsonFiles(resolve(process.cwd(), root), issues);
  }

  const report = {
    status: issues.length === 0 ? "PASS" : "FAIL",
    checked_at: new Date().toISOString(),
    issues,
    warnings
  };

  console.log(JSON.stringify(report, null, 2));

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
