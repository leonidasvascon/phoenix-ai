import type { RuntimeResponse } from "../types.ts";
import type { PersistenceAdapter, PersistenceResult } from "./persistence-adapter.ts";

export class MemoryPersistenceAdapter implements PersistenceAdapter {
  private readonly executions = new Map<string, RuntimeResponse>();

  async saveExecution(response: RuntimeResponse): Promise<PersistenceResult> {
    this.executions.set(response.execution.id, response);

    return {
      persisted: true,
      storage: `memory://executions/${response.execution.id}`
    };
  }

  getExecution(id: string): RuntimeResponse | undefined {
    return this.executions.get(id);
  }
}

