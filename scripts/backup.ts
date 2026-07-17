import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { getVersionInfo } from "@phoenix-ai/version";

type BackupFile = {
  path: string;
  content: string;
};

const backupTargets = [
  "prompts/brands",
  ".storage/memory",
  ".storage/feedback.json",
  ".storage/prompt-optimizations.json",
  ".storage/strategy",
  ".storage/publications",
  ".storage/quality",
  ".storage/scheduled-jobs.json",
  ".storage/task-templates.json",
  ".storage/batch-templates.json",
  ".storage/settings.json",
  ".storage/executions",
  ".storage/workspaces"
];

async function collectFiles(target: string, files: BackupFile[]): Promise<void> {
  const absolute = resolve(process.cwd(), target);

  if (!existsSync(absolute)) {
    return;
  }

  const entries = await readdir(absolute, { withFileTypes: true }).catch(async () => []);

  if (entries.length === 0 && !target.endsWith("/")) {
    const content = await readFile(absolute, "utf8");
    files.push({ path: relative(process.cwd(), absolute).replaceAll("\\", "/"), content });
    return;
  }

  for (const entry of entries) {
    const child = join(absolute, entry.name);

    if (entry.isDirectory()) {
      await collectFiles(relative(process.cwd(), child), files);
      continue;
    }

    const content = await readFile(child, "utf8");
    files.push({ path: relative(process.cwd(), child).replaceAll("\\", "/"), content });
  }
}

async function main() {
  const files: BackupFile[] = [];

  for (const target of backupTargets) {
    await collectFiles(target, files);
  }

  const backup = {
    created_at: new Date().toISOString(),
    version: getVersionInfo(),
    files
  };
  const backupDirectory = resolve(process.cwd(), ".storage", "backups");
  await mkdir(backupDirectory, { recursive: true });
  const destination = resolve(backupDirectory, `phoenix-backup-${new Date().toISOString().replaceAll(":", "-")}.json`);
  await writeFile(destination, JSON.stringify(backup, null, 2), "utf8");
  console.log(JSON.stringify({ status: "success", file: destination, files: files.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
