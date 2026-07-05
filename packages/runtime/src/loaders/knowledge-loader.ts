import type { Brand, KnowledgeContext, Task } from "../types.ts";
import { loadKnowledgeBase, retrieveKnowledge } from "../../../knowledge-engine/src/index.ts";

export async function loadKnowledge(task: Task, brand: Brand): Promise<KnowledgeContext> {
  const base = await loadKnowledgeBase();

  return retrieveKnowledge(base, {
    theme: task.theme,
    brandPreferences: {
      preferred_hooks: brand.preferred_hooks,
      preferred_storytelling: brand.preferred_storytelling,
      preferred_cta: brand.preferred_cta,
      preferred_emotions: brand.preferred_emotions,
      forbidden_patterns: brand.forbidden_patterns
    }
  });
}
