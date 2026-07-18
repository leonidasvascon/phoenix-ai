export const knowledgeRelationTypes = [
  "owns",
  "generated",
  "published_as",
  "references",
  "belongs_to",
  "uses",
  "triggered",
  "created_by",
  "related_to"
] as const;

export type KnowledgeRelationType = typeof knowledgeRelationTypes[number] | string;

export type KnowledgeEdge = {
  id: string;
  from: string;
  to: string;
  type: KnowledgeRelationType;
  workspace_id: string;
  weight: number;
  metadata: Record<string, unknown>;
  created_at: string;
};
