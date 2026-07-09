import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type BatchTaskItem = {
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: string;
};

export type BatchTemplate = {
  id: string;
  name: string;
  items: BatchTaskItem[];
  created_at: string;
  updated_at: string;
};

type BatchTemplateInput = {
  name?: unknown;
  items?: unknown;
};

function getTemplatesPath(): string {
  return resolve(process.cwd(), ".storage", "batch-templates.json");
}

export async function listBatchTemplates(): Promise<BatchTemplate[]> {
  return readTemplates();
}

export async function createBatchTemplate(input: unknown): Promise<BatchTemplate> {
  const payload = validateTemplateInput(input);
  const now = new Date().toISOString();
  const templates = await readTemplates();
  const template: BatchTemplate = {
    id: randomUUID(),
    ...payload,
    created_at: now,
    updated_at: now
  };

  await writeTemplates([...templates, template]);

  return template;
}

export async function updateBatchTemplate(templateId: string, input: unknown): Promise<BatchTemplate | null> {
  validateTemplateId(templateId);
  const payload = validateTemplateInput(input);
  const templates = await readTemplates();
  const index = templates.findIndex((template) => template.id === templateId);

  if (index === -1) {
    return null;
  }

  const updated: BatchTemplate = {
    ...templates[index],
    ...payload,
    updated_at: new Date().toISOString()
  };

  templates[index] = updated;
  await writeTemplates(templates);

  return updated;
}

export async function deleteBatchTemplate(templateId: string): Promise<boolean> {
  validateTemplateId(templateId);
  const templates = await readTemplates();
  const nextTemplates = templates.filter((template) => template.id !== templateId);

  if (nextTemplates.length === templates.length) {
    return false;
  }

  await writeTemplates(nextTemplates);

  return true;
}

async function readTemplates(): Promise<BatchTemplate[]> {
  try {
    const source = await readFile(getTemplatesPath(), "utf8");
    const parsed = JSON.parse(source) as unknown;

    return Array.isArray(parsed) ? parsed.filter(isBatchTemplate) : [];
  } catch {
    return [];
  }
}

async function writeTemplates(templates: BatchTemplate[]): Promise<void> {
  const templatesPath = getTemplatesPath();

  await mkdir(dirname(templatesPath), { recursive: true });
  await writeFile(templatesPath, `${JSON.stringify(templates, null, 2)}\n`, "utf8");
}

function validateTemplateInput(input: unknown): Pick<BatchTemplate, "items" | "name"> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid batch template payload.");
  }

  const payload = input as BatchTemplateInput;
  const name = readRequiredString(payload.name, "Template name is required.");

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Batch template items are required.");
  }

  return {
    name,
    items: payload.items.map(validateBatchItem)
  };
}

function validateBatchItem(item: unknown): BatchTaskItem {
  if (!item || typeof item !== "object") {
    throw new Error("Invalid batch item.");
  }

  const payload = item as Partial<Record<keyof BatchTaskItem, unknown>>;
  const format = readRequiredString(payload.format, "Format is required.");

  if (!["reel", "carousel", "story"].includes(format)) {
    throw new Error("Invalid batch item format.");
  }

  return {
    brand: readRequiredString(payload.brand, "Brand is required."),
    theme: readRequiredString(payload.theme, "Theme is required."),
    objective: readRequiredString(payload.objective, "Objective is required."),
    platform: readString(payload.platform, "instagram"),
    format
  };
}

function validateTemplateId(templateId: string): void {
  if (!templateId || !/^[a-zA-Z0-9-]+$/.test(templateId)) {
    throw new Error("Invalid batch template id.");
  }
}

function readRequiredString(value: unknown, message: string): string {
  const text = readString(value, "");

  if (!text) {
    throw new Error(message);
  }

  return text;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isBatchTemplate(value: unknown): value is BatchTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as BatchTemplate;

  return Boolean(template.id && template.name && Array.isArray(template.items));
}
