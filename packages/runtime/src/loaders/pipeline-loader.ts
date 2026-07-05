import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Pipeline, PipelineStep } from "../types.ts";

function readTopLevelValue(source: string, key: string): string {
  const match = source.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function parseSteps(source: string): PipelineStep[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const steps: PipelineStep[] = [];
  let current: PipelineStep | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- id:")) {
      if (current) steps.push(current);
      current = {
        id: trimmed.replace("- id:", "").trim(),
        type: "agent"
      };
      continue;
    }

    if (!current) continue;

    if (trimmed.startsWith("type:")) {
      current.type = trimmed.replace("type:", "").trim() as PipelineStep["type"];
    }

    if (trimmed.startsWith("agent:")) {
      current.agent = trimmed.replace("agent:", "").trim();
    }

    if (trimmed.startsWith("description:")) {
      current.description = trimmed.replace("description:", "").trim();
    }
  }

  if (current) steps.push(current);

  return steps;
}

function parseOutputFields(source: string): string[] {
  const fields: string[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let inFields = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "fields:") {
      inFields = true;
      continue;
    }
    if (inFields && trimmed.startsWith("- ")) {
      fields.push(trimmed.slice(2).trim());
      continue;
    }
    if (inFields && trimmed && !trimmed.startsWith("- ")) {
      break;
    }
  }

  return fields;
}

export async function loadPipeline(format: string): Promise<Pipeline> {
  const pipelinePath = resolve(process.cwd(), "pipelines", `${format}.yaml`);
  const source = await readFile(pipelinePath, "utf8");

  const pipeline: Pipeline = {
    name: readTopLevelValue(source, "name"),
    version: readTopLevelValue(source, "version"),
    steps: parseSteps(source),
    outputFields: parseOutputFields(source)
  };

  if (!pipeline.name || pipeline.steps.length === 0) {
    throw new Error(`Invalid pipeline: ${format}`);
  }

  return pipeline;
}

