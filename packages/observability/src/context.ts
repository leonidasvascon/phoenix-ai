import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";

export type ObservabilityContext = {
  trace_id: string;
  span_id: string;
  execution_id?: string;
  publication_id?: string;
  scheduled_job_id?: string;
};

const storage = new AsyncLocalStorage<ObservabilityContext>();

export function getCurrentContext(): ObservabilityContext | undefined {
  return storage.getStore();
}

export function getTraceId(): string | undefined {
  return getCurrentContext()?.trace_id;
}

export function getSpanId(): string | undefined {
  return getCurrentContext()?.span_id;
}

export function withObservabilityContext<T>(context: Partial<ObservabilityContext>, callback: () => T): T {
  const parent = getCurrentContext();
  const next: ObservabilityContext = {
    trace_id: context.trace_id ?? parent?.trace_id ?? createTraceId(),
    span_id: context.span_id ?? parent?.span_id ?? createSpanId(),
    execution_id: context.execution_id ?? parent?.execution_id,
    publication_id: context.publication_id ?? parent?.publication_id,
    scheduled_job_id: context.scheduled_job_id ?? parent?.scheduled_job_id
  };

  return storage.run(next, callback);
}

export function createTraceId(): string {
  return randomBytes(16).toString("hex");
}

export function createSpanId(): string {
  return randomBytes(8).toString("hex");
}
