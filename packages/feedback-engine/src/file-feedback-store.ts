import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ContentFeedback, FeedbackInput, FeedbackStore } from "./feedback-store.ts";

export class FileFeedbackStore implements FeedbackStore {
  private readonly storagePath: string;

  constructor(storagePath = resolve(process.cwd(), ".storage", "feedback.json")) {
    this.storagePath = storagePath;
  }

  async list(): Promise<ContentFeedback[]> {
    return this.readFeedback();
  }

  async getByExecutionId(executionId: string): Promise<ContentFeedback | null> {
    const feedback = await this.readFeedback();

    return feedback.find((item) => item.execution_id === executionId) ?? null;
  }

  async save(input: FeedbackInput): Promise<ContentFeedback> {
    const feedback = await this.readFeedback();
    const existingIndex = feedback.findIndex((item) => item.execution_id === input.execution_id);
    const now = new Date().toISOString();
    const entry: ContentFeedback = {
      ...input,
      created_at: existingIndex >= 0 ? feedback[existingIndex].created_at : now,
      updated_at: now
    };

    if (existingIndex >= 0) {
      feedback[existingIndex] = entry;
    } else {
      feedback.push(entry);
    }

    await this.writeFeedback(feedback);

    return entry;
  }

  private async readFeedback(): Promise<ContentFeedback[]> {
    try {
      const source = await readFile(this.storagePath, "utf8");
      const parsed = JSON.parse(source) as unknown;

      return Array.isArray(parsed) ? parsed.filter(isContentFeedback) : [];
    } catch {
      return [];
    }
  }

  private async writeFeedback(feedback: ContentFeedback[]): Promise<void> {
    await mkdir(dirname(this.storagePath), { recursive: true });
    await writeFile(this.storagePath, `${JSON.stringify(feedback, null, 2)}\n`, "utf8");
  }
}

function isContentFeedback(value: unknown): value is ContentFeedback {
  if (!value || typeof value !== "object") {
    return false;
  }

  const feedback = value as ContentFeedback;

  return Boolean(feedback.execution_id && feedback.platform && feedback.posted_at);
}
