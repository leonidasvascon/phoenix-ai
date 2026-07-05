import type { BrandMemory, MemoryStore } from "./memory-store.ts";

export async function retrieveMemory(store: MemoryStore, brandId: string): Promise<BrandMemory> {
  return store.read(brandId);
}
