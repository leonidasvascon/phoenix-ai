import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const promptAliases: Record<string, string> = {
  research: "research.md",
  hook_specialist: "hook_specialist.md",
  story_writer: "story_writer.md",
  reviewer: "reviewer.md"
};

export async function loadPrompt(agentId: string): Promise<string> {
  const fileName = promptAliases[agentId] ?? `${agentId}.md`;
  const promptPath = resolve(process.cwd(), "prompts", "agents", fileName);

  return readFile(promptPath, "utf8");
}

