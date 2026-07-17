import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Backup = {
  files: Array<{
    path: string;
    content: string;
  }>;
};

async function main() {
  const args = process.argv.slice(2).filter((argument) => argument !== "--");
  const backupPath = args.find((argument) => !argument.startsWith("--"));
  const confirmed = args.includes("--yes") || process.env.PHOENIX_RESTORE_CONFIRM === "true";

  if (!backupPath) {
    throw new Error("Usage: pnpm run restore -- <backup-file> --yes");
  }

  if (!confirmed) {
    throw new Error("Restore requires --yes or PHOENIX_RESTORE_CONFIRM=true.");
  }

  const backup = JSON.parse(await readFile(resolve(process.cwd(), backupPath), "utf8")) as Backup;

  for (const file of backup.files) {
    const destination = resolve(process.cwd(), file.path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.content, "utf8");
  }

  console.log(JSON.stringify({ status: "success", restored_files: backup.files.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
