import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { encryptSecret } from "@phoenix-ai/secrets";

if (process.env.PHOENIX_CONFIRM_SECRETS_BACKUP !== "true") {
  console.log("Set PHOENIX_CONFIRM_SECRETS_BACKUP=true to create an encrypted secrets backup.");
  process.exit(0);
}

const root = resolve(process.cwd(), ".storage", "secrets");
const output = resolve(process.cwd(), "reports", "secrets-backup.json");
await mkdir(resolve(process.cwd(), "reports"), { recursive: true });
const manifest: Record<string, unknown> = { created_at: new Date().toISOString(), files: [] as string[], encrypted_files: [] as unknown[] };

async function collect(dir: string): Promise<void> {
  let entries: string[] = [];
  try { entries = await readdir(dir); } catch { return; }
  for (const entry of entries) {
    const path = resolve(dir, entry);
    try {
      const content = await readFile(path, "utf8");
      (manifest.files as string[]).push(path.replace(root, ""));
      (manifest.encrypted_files as unknown[]).push({ path: path.replace(root, ""), encrypted: encryptSecret(content) });
    } catch {
      await collect(path);
    }
  }
}

await collect(root);
await writeFile(output, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Encrypted secrets backup written to ${output}`);
