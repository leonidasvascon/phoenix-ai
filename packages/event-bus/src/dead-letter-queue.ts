import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { DeadLetterEntry } from "./event-schema.ts";

export function dlqRoot(): string {
  return resolve(process.cwd(), ".storage", "dlq");
}

export async function listDeadLetters(): Promise<DeadLetterEntry[]> {
  try {
    const parsed = JSON.parse(await readFile(resolve(dlqRoot(), "items.json"), "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as DeadLetterEntry[] : [];
  } catch {
    return [];
  }
}

export async function addDeadLetter(entry: DeadLetterEntry): Promise<void> {
  const items = await listDeadLetters();
  await mkdir(dlqRoot(), { recursive: true });
  await writeFile(resolve(dlqRoot(), "items.json"), `${JSON.stringify([entry, ...items], null, 2)}\n`, "utf8");
}

export async function removeDeadLetter(id: string): Promise<DeadLetterEntry | null> {
  const items = await listDeadLetters();
  const entry = items.find((item) => item.id === id) ?? null;
  if (!entry) return null;
  await mkdir(dlqRoot(), { recursive: true });
  await writeFile(resolve(dlqRoot(), "items.json"), `${JSON.stringify(items.filter((item) => item.id !== id), null, 2)}\n`, "utf8");
  return entry;
}
