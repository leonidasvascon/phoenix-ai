import { knowledgeEntityTypes, type KnowledgeEntityType } from "./node.ts";

const customEntityTypes = new Set<string>();

export function registerEntityType(type: string): void {
  if (!/^[A-Z][A-Za-z0-9_-]+$/.test(type)) throw new Error("Invalid entity type.");
  customEntityTypes.add(type);
}

export function listEntityTypes(): string[] {
  return [...knowledgeEntityTypes, ...Array.from(customEntityTypes)].sort();
}

export function isKnownEntityType(type: string): type is KnowledgeEntityType {
  return knowledgeEntityTypes.includes(type as (typeof knowledgeEntityTypes)[number]) || customEntityTypes.has(type);
}
