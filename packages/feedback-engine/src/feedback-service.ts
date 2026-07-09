import type { ContentFeedback, FeedbackInput, FeedbackStore } from "./feedback-store.ts";

export class FeedbackService {
  private readonly store: FeedbackStore;

  constructor(store: FeedbackStore) {
    this.store = store;
  }

  listFeedback(): Promise<ContentFeedback[]> {
    return this.store.list();
  }

  getFeedback(executionId: string): Promise<ContentFeedback | null> {
    validateExecutionId(executionId);
    return this.store.getByExecutionId(executionId);
  }

  saveFeedback(input: unknown): Promise<ContentFeedback> {
    return this.store.save(validateFeedbackInput(input));
  }
}

function validateFeedbackInput(input: unknown): FeedbackInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid feedback payload.");
  }

  const payload = input as Partial<Record<keyof FeedbackInput, unknown>>;
  const executionId = readRequiredString(payload.execution_id, "Execution id is required.");
  const postedAt = readRequiredString(payload.posted_at, "Posted date is required.");

  validateExecutionId(executionId);

  if (Number.isNaN(Date.parse(postedAt))) {
    throw new Error("Invalid posted_at date.");
  }

  return {
    execution_id: executionId,
    platform: readString(payload.platform, "instagram"),
    views: readMetric(payload.views),
    likes: readMetric(payload.likes),
    comments: readMetric(payload.comments),
    shares: readMetric(payload.shares),
    saves: readMetric(payload.saves),
    followers_gained: readMetric(payload.followers_gained),
    posted_at: postedAt
  };
}

function validateExecutionId(executionId: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(executionId)) {
    throw new Error("Invalid execution id.");
  }
}

function readMetric(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("Feedback metrics must be non-negative numbers.");
  }

  return Math.round(numberValue);
}

function readRequiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim();
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
