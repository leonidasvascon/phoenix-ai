import type { PublicationResult } from "../types/publication.ts";

export interface PublicationStore {
  list(): Promise<PublicationResult[]>;
  get(id: string): Promise<PublicationResult | null>;
  save(publication: PublicationResult): Promise<PublicationResult>;
  findByExecutionPlatform(executionId: string, platform: string): Promise<PublicationResult | null>;
}
