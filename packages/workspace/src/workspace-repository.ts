import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const defaultWorkspaceId = "default-workspace";
export const workspacesRoot = () => resolve(process.cwd(), ".storage", "workspaces");
export const workspacePath = (workspaceId: string) => resolve(workspacesRoot(), workspaceId);

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

export async function listWorkspaceIds(): Promise<string[]> {
  try {
    const entries = await readdir(workspacesRoot(), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

export function workspaceExists(workspaceId: string): boolean {
  return existsSync(resolve(workspacePath(workspaceId), "workspace.json"));
}
