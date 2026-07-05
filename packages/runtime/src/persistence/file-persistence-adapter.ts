import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { RuntimeResponse } from "../types.ts";
import type { PersistenceAdapter, PersistenceResult } from "./persistence-adapter.ts";

export class FilePersistenceAdapter implements PersistenceAdapter {
  private readonly storageRoot: string;

  constructor(storageRoot = ".storage") {
    this.storageRoot = storageRoot;
  }

  async saveExecution(response: RuntimeResponse): Promise<PersistenceResult> {
    const storage = join(this.storageRoot, "executions", `${response.execution.id}.json`).replace(/\\/g, "/");

    await mkdir(dirname(storage), {
      recursive: true
    });
    await writeFile(storage, JSON.stringify(response, null, 2), "utf8");

    return {
      persisted: true,
      storage
    };
  }
}
