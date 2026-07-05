export type RecentOutput = {
  execution_id: string;
  theme: string;
  format: string;
  hook?: string;
  cta?: string;
  score?: number;
  created_at: string;
};

export type BrandMemory = {
  brand_id: string;
  used_hooks: string[];
  used_themes: string[];
  used_ctas: string[];
  used_storytelling: string[];
  recent_outputs: RecentOutput[];
};

export type MemoryStore = {
  read(brandId: string): Promise<BrandMemory>;
  write(memory: BrandMemory): Promise<void>;
};

export function createEmptyMemory(brandId: string): BrandMemory {
  return {
    brand_id: brandId,
    used_hooks: [],
    used_themes: [],
    used_ctas: [],
    used_storytelling: [],
    recent_outputs: []
  };
}
