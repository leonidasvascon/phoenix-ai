import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PublicationStore } from "./publication-store.ts";
import type { PublicationResult } from "../types/publication.ts";

export class FilePublicationStore implements PublicationStore {
  private readonly directory: string;

  constructor(directory = resolve(process.cwd(), ".storage", "publications")) {
    this.directory = directory;
  }

  async list(): Promise<PublicationResult[]> {
    let files: string[] = [];

    try {
      files = await readdir(this.directory);
    } catch {
      return [];
    }

    const publications = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => JSON.parse(await readFile(resolve(this.directory, file), "utf8")) as PublicationResult)
    );

    return publications.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async get(id: string): Promise<PublicationResult | null> {
    try {
      return JSON.parse(await readFile(resolve(this.directory, `${id}.json`), "utf8")) as PublicationResult;
    } catch {
      return null;
    }
  }

  async save(publication: PublicationResult): Promise<PublicationResult> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(resolve(this.directory, `${publication.id}.json`), JSON.stringify(publication, null, 2), "utf8");

    return publication;
  }

  async findByExecutionPlatform(executionId: string, platform: string): Promise<PublicationResult | null> {
    const publications = await this.list();

    return publications.find((publication) =>
      publication.execution_id === executionId &&
      publication.platform === platform &&
      publication.status !== "cancelled"
    ) ?? null;
  }
}
