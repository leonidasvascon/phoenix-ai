import type { RuntimeResponse } from "../types.ts";

export type PersistenceResult = {
  persisted: boolean;
  storage?: string;
};

export type PersistenceAdapter = {
  saveExecution(response: RuntimeResponse): Promise<PersistenceResult>;
};

