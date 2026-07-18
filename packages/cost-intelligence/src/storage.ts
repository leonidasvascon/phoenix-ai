import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export function costPath(...parts: string[]): string {
  return resolve(process.cwd(), ".storage", "cost", ...parts);
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function readJsonDirectory<T>(directory: string): Promise<T[]> {
  try {
    const files = await readdir(directory, { withFileTypes: true });
    const values: T[] = [];
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".json")) {
        values.push(await readJson<T>(resolve(directory, file.name), {} as T));
      }
    }
    return values;
  } catch {
    return [];
  }
}

export async function clearDirectory(directory: string): Promise<void> {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}
