import type { KnowledgeCategory, KnowledgeContext, KnowledgeDocument, KnowledgeQuery } from "./types.ts";

const emptyCategories: Record<KnowledgeCategory, KnowledgeDocument[]> = {
  emotions: [],
  storytelling: [],
  hooks: [],
  vocabulary: [],
  ctas: [],
  forbidden: []
};

function byId(documents: KnowledgeDocument[], ids: Array<string | undefined>): KnowledgeDocument[] {
  const normalized = ids.filter((id): id is string => Boolean(id)).map((id) => id.toLowerCase());

  return documents.filter((document) => normalized.includes(document.id.toLowerCase()));
}

function byKeyword(documents: KnowledgeDocument[], keyword: string): KnowledgeDocument[] {
  const normalized = keyword.toLowerCase();

  return documents.filter((document) => {
    if (document.id.toLowerCase() === normalized) return true;
    return document.keywords?.some((item) => item.toLowerCase() === normalized) ?? false;
  });
}

export function retrieveKnowledge(base: KnowledgeContext, query: KnowledgeQuery): KnowledgeContext {
  const preferences = query.brandPreferences ?? {};
  const selected: Record<KnowledgeCategory, KnowledgeDocument[]> = {
    ...emptyCategories,
    emotions: [
      ...byKeyword(base.by_category.emotions, query.theme),
      ...byId(base.by_category.emotions, preferences.preferred_emotions ?? [])
    ],
    hooks: byId(base.by_category.hooks, preferences.preferred_hooks ?? []),
    storytelling: byId(base.by_category.storytelling, preferences.preferred_storytelling ?? []),
    ctas: byId(base.by_category.ctas, [preferences.preferred_cta]),
    forbidden: byId(base.by_category.forbidden, preferences.forbidden_patterns ?? []),
    vocabulary: base.by_category.vocabulary
  };

  const documents = Object.values(selected)
    .flat()
    .filter((document, index, list) => list.findIndex((item) => item.category === document.category && item.id === document.id) === index);

  return {
    documents,
    by_category: selected
  };
}
