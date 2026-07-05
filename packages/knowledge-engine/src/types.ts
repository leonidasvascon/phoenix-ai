export type KnowledgeCategory = "emotions" | "storytelling" | "hooks" | "vocabulary" | "ctas" | "forbidden";

export type KnowledgeDocument = {
  category: KnowledgeCategory;
  id: string;
  title?: string;
  objective?: string;
  usage?: string;
  examples?: string[];
  avoid?: string[];
  keywords?: string[];
  notes?: string;
  [key: string]: unknown;
};

export type KnowledgeContext = {
  documents: KnowledgeDocument[];
  by_category: Record<KnowledgeCategory, KnowledgeDocument[]>;
};

export type KnowledgeQuery = {
  theme: string;
  brandPreferences?: {
    preferred_hooks?: string[];
    preferred_storytelling?: string[];
    preferred_cta?: string;
    preferred_emotions?: string[];
    forbidden_patterns?: string[];
  };
};
