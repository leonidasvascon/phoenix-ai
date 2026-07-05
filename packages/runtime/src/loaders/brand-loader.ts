import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Brand } from "../types.ts";
import { parseSimpleYaml } from "../utils/simple-yaml.ts";

export async function loadBrand(brandId: string): Promise<Brand> {
  const brandPath = resolve(process.cwd(), "prompts", "brands", `${brandId}.yaml`);
  const source = await readFile(brandPath, "utf8");
  const brand = parseSimpleYaml(source) as Brand;

  if (!brand.brand?.id || !brand.brand?.name) {
    throw new Error(`Invalid Brand DNA: ${brandId}`);
  }

  return brand;
}

