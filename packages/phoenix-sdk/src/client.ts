import { PhoenixApiError } from "./errors.ts";
import type { PhoenixClientOptions, PhoenixErrorPayload, RequestOptions } from "./types.ts";
import { TasksResource } from "./resources/tasks.ts";
import { ExecutionsResource } from "./resources/executions.ts";
import { BrandsResource } from "./resources/brands.ts";
import { AnalyticsResource } from "./resources/analytics.ts";
import { LearningResource } from "./resources/learning.ts";
import { FeedbackResource } from "./resources/feedback.ts";
import { StrategyResource } from "./resources/strategy.ts";
import { PublicationsResource } from "./resources/publications.ts";
import { ProvidersResource } from "./resources/providers.ts";
import { SchedulerResource } from "./resources/scheduler.ts";

export class PhoenixClient {
  readonly tasks = new TasksResource(this);
  readonly executions = new ExecutionsResource(this);
  readonly brands = new BrandsResource(this);
  readonly analytics = new AnalyticsResource(this);
  readonly learning = new LearningResource(this);
  readonly feedback = new FeedbackResource(this);
  readonly strategy = new StrategyResource(this);
  readonly publications = new PublicationsResource(this);
  readonly providers = new ProvidersResource(this);
  readonly scheduler = new SchedulerResource(this);
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly bearerToken?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PhoenixClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.bearerToken = options.bearerToken;
    this.timeoutMs = options.timeoutMs ?? 30000;
    this.fetchImpl = options.fetch ?? fetch;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = new Headers({ "Content-Type": "application/json" });
    if (this.apiKey) headers.set("X-Phoenix-Api-Key", this.apiKey);
    if (this.bearerToken) headers.set("Authorization", `Bearer ${this.bearerToken}`);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) as unknown : null;
      if (!response.ok) {
        throw new PhoenixApiError(normalizeErrorPayload(payload, response.status));
      }
      return payload as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeErrorPayload(payload: unknown, status: number): PhoenixErrorPayload {
  if (payload && typeof payload === "object" && "error" in payload) return payload as PhoenixErrorPayload;
  return { error: { code: "HTTP_ERROR", message: `Phoenix API request failed with status ${status}.`, status } };
}
