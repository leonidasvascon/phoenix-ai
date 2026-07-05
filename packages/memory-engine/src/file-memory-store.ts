import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createEmptyMemory, type BrandMemory, type MemoryStore } from "./memory-store.ts";

export class FileMemoryStore implements MemoryStore {
  private readonly root: string;

  constructor(root = resolve(process.cwd(), ".storage", "memory")) {
    this.root = root;
  }

  async read(brandId: string): Promise<BrandMemory> {
    const memoryPath = this.getMemoryPath(brandId);

    try {
      const source = await readFile(memoryPath, "utf8");
      return {
        ...createEmptyMemory(brandId),
        ...JSON.parse(source)
      };
    } catch {
      return createEmptyMemory(brandId);
    }
  }

  async write(memory: BrandMemory): Promise<void> {
    const memoryPath = this.getMemoryPath(memory.brand_id);
    await mkdir(dirname(memoryPath), { recursive: true });
    await writeFile(memoryPath, `${JSON.stringify(memory, null, 2)}\n`, "utf8");
  }

  getMemoryPath(brandId: string): string {
    return join(this.root, `${brandId}.json`);
  }
}
