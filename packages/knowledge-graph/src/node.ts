export const knowledgeEntityTypes = [
  "Brand",
  "Document",
  "Product",
  "Campaign",
  "Audience",
  "Post",
  "Workflow",
  "Task",
  "Publication",
  "Plugin",
  "User"
] as const;

export type KnowledgeEntityType = typeof knowledgeEntityTypes[number] | string;

export type KnowledgeNode = {
  id: string;
  type: KnowledgeEntityType;
  label: string;
  workspace_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
