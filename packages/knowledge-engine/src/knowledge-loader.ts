import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseSimpleYaml } from "./simple-yaml.ts";
import type { KnowledgeCategory, KnowledgeContext, KnowledgeDocument } from "./types.ts";

const categories: KnowledgeCategory[] = ["emotions", "storytelling", "hooks", "vocabulary", "ctas", "forbidden"];

function emptyKnowledgeContext(): KnowledgeContext {
  return {
    documents: [],
    by_category: {
      emotions: [],
      storytelling: [],
      hooks: [],
      vocabulary: [],
      ctas: [],
      forbidden: []
    }
  };
}

export async function loadKnowledgeBase(root = resolve(process.cwd(), "knowledge")): Promise<KnowledgeContext> {
  const context = emptyKnowledgeContext();

  for (const category of categories) {
    const directory = join(root, category);
    let files: string[] = [];

    try {
      files = await readdir(directory);
    } catch {
      continue;
    }

    for (const file of files.filter((name) => name.endsWith(".yaml"))) {
      const source = await readFile(join(directory, file), "utf8");
      const parsed = parseSimpleYaml(source);
      const document: KnowledgeDocument = {
        category,
        id: String(parsed.id ?? file.replace(/\.yaml$/, "")),
        ...parsed
      };

      context.documents.push(document);
      context.by_category[category].push(document);
    }
  }

  return context;
}
