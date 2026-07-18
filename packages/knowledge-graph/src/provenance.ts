export type KnowledgeProvenance = {
  id: string;
  entity_id: string;
  document_id: string;
  workspace_id: string;
  source: string;
  chunk: string;
  score: number;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type ProvenanceResult = KnowledgeProvenance & {
  entity?: {
    id: string;
    type: string;
    label: string;
  };
};
