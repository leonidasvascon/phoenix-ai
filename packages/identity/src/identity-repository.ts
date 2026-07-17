import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const identityRoot = () => resolve(process.cwd(), ".storage", "identity");
export const usersRoot = () => resolve(identityRoot(), "users");
export const sessionsRoot = () => resolve(identityRoot(), "sessions");
export const providersRoot = () => resolve(identityRoot(), "providers");
export const loginAttemptsRoot = () => resolve(identityRoot(), "login-attempts");
export const passwordResetsRoot = () => resolve(identityRoot(), "password-resets");

export async function ensureIdentityStorage(): Promise<void> {
  await Promise.all([
    mkdir(usersRoot(), { recursive: true }),
    mkdir(sessionsRoot(), { recursive: true }),
    mkdir(providersRoot(), { recursive: true }),
    mkdir(loginAttemptsRoot(), { recursive: true }),
    mkdir(passwordResetsRoot(), { recursive: true })
  ]);
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
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

export async function listJsonFiles<T>(directory: string): Promise<T[]> {
  try {
    const files = await readdir(directory);
    return Promise.all(files.filter((file) => file.endsWith(".json")).map((file) => readJson<T>(resolve(directory, file), null as T)));
  } catch {
    return [];
  }
}

export function jsonExists(path: string): boolean {
  return existsSync(path);
}
