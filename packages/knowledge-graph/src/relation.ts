import { knowledgeRelationTypes, type KnowledgeRelationType } from "./edge.ts";

const customRelationTypes = new Set<string>();

export function registerRelationType(type: string): void {
  if (!/^[a-z][a-z0-9_-]+$/.test(type)) throw new Error("Invalid relation type.");
  customRelationTypes.add(type);
}

export function listRelationTypes(): string[] {
  return [...knowledgeRelationTypes, ...Array.from(customRelationTypes)].sort();
}

export function isKnownRelationType(type: string): type is KnowledgeRelationType {
  return knowledgeRelationTypes.includes(type as (typeof knowledgeRelationTypes)[number]) || customRelationTypes.has(type);
}
