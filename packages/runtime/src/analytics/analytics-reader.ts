import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RuntimeResponse } from "../types.ts";

export async function readExecutionFiles(storageRoot = ".storage"): Promise<RuntimeResponse[]> {
  const executionsDir = join(storageRoot, "executions");

  let files: string[];
  try {
    files = await readdir(executionsDir);
  } catch {
    return [];
  }

  const executions: RuntimeResponse[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const path = join(executionsDir, file);
    const source = await readFile(path, "utf8");
    executions.push(JSON.parse(source) as RuntimeResponse);
  }

  return executions;
}

