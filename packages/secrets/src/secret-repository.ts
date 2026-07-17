import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function secretsRoot(): string {
  return resolve(process.cwd(), ".storage", "secrets");
}

export function metadataRoot(): string {
  return resolve(secretsRoot(), "metadata");
}

export function vaultRoot(): string {
  return resolve(secretsRoot(), "vault");
}

export function versionsRoot(): string {
  return resolve(secretsRoot(), "versions");
}

export function auditRoot(): string {
  return resolve(secretsRoot(), "audit");
}

export async function ensureSecretsStorage(): Promise<void> {
  await Promise.all([metadataRoot(), vaultRoot(), versionsRoot(), auditRoot()].map((path) => mkdir(path, { recursive: true })));
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), "utf8");
  await rename(temp, path);
}

export async function listJsonFiles<T>(root: string): Promise<T[]> {
  await mkdir(root, { recursive: true });
  const files = await readdir(root);
  return Promise.all(files.filter((file) => file.endsWith(".json")).map((file) => readJson<T>(resolve(root, file), null as T)));
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}
