import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type TaskTemplate = {
  id: string;
  name: string;
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: string;
  created_at: string;
  updated_at: string;
};

type TaskTemplateInput = Partial<Record<keyof Omit<TaskTemplate, "created_at" | "id" | "updated_at">, unknown>>;

function getTemplatesPath(): string {
  return resolve(process.cwd(), ".storage", "task-templates.json");
}

export async function listTaskTemplates(): Promise<TaskTemplate[]> {
  return readTemplates();
}

export async function createTaskTemplate(input: unknown): Promise<TaskTemplate> {
  const payload = validateTemplateInput(input);
  const now = new Date().toISOString();
  const templates = await readTemplates();
  const template: TaskTemplate = {
    id: randomUUID(),
    ...payload,
    created_at: now,
    updated_at: now
  };

  await writeTemplates([...templates, template]);

  return template;
}

export async function updateTaskTemplate(templateId: string, input: unknown): Promise<TaskTemplate | null> {
  validateTemplateId(templateId);
  const payload = validateTemplateInput(input);
  const templates = await readTemplates();
  const index = templates.findIndex((template) => template.id === templateId);

  if (index === -1) {
    return null;
  }

  const updated: TaskTemplate = {
    ...templates[index],
    ...payload,
    updated_at: new Date().toISOString()
  };

  templates[index] = updated;
  await writeTemplates(templates);

  return updated;
}

export async function deleteTaskTemplate(templateId: string): Promise<boolean> {
  validateTemplateId(templateId);
  const templates = await readTemplates();
  const nextTemplates = templates.filter((template) => template.id !== templateId);

  if (nextTemplates.length === templates.length) {
    return false;
  }

  await writeTemplates(nextTemplates);

  return true;
}

async function readTemplates(): Promise<TaskTemplate[]> {
  try {
    const source = await readFile(getTemplatesPath(), "utf8");
    const parsed = JSON.parse(source) as unknown;

    return Array.isArray(parsed) ? parsed.filter(isTaskTemplate) : [];
  } catch {
    return [];
  }
}

async function writeTemplates(templates: TaskTemplate[]): Promise<void> {
  const templatesPath = getTemplatesPath();

  await mkdir(dirname(templatesPath), { recursive: true });
  await writeFile(templatesPath, `${JSON.stringify(templates, null, 2)}\n`, "utf8");
}

function validateTemplateInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid task template payload.");
  }

  const payload = input as TaskTemplateInput;
  const name = readRequiredString(payload.name, "Template name is required.");
  const brand = readRequiredString(payload.brand, "Brand is required.");
  const theme = readRequiredString(payload.theme, "Theme is required.");
  const objective = readRequiredString(payload.objective, "Objective is required.");
  const platform = readString(payload.platform, "instagram");
  const format = readRequiredString(payload.format, "Format is required.");

  if (!["reel", "carousel", "story"].includes(format)) {
    throw new Error("Invalid template format.");
  }

  return {
    name,
    brand,
    theme,
    objective,
    platform,
    format
  };
}

function validateTemplateId(templateId: string): void {
  if (!templateId || !/^[a-zA-Z0-9-]+$/.test(templateId)) {
    throw new Error("Invalid task template id.");
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

function isTaskTemplate(value: unknown): value is TaskTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as TaskTemplate;

  return Boolean(
    template.id
      && template.name
      && template.brand
      && template.theme
      && template.objective
      && template.platform
      && template.format
  );
}
