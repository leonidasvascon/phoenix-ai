import { createSpanId, getCurrentContext, withObservabilityContext } from "./context.ts";
import { incrementCounter, recordDuration } from "./metrics.ts";
import { sanitizeAttributes } from "./sanitization.ts";
import { isObservabilityEnabled } from "./telemetry.ts";

export type SpanStatus = "error" | "ok";
export type SpanRecord = {
  name: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  started_at: string;
  duration_ms: number;
  status: SpanStatus;
  attributes: Record<string, string | number | boolean | null>;
};

const spans: SpanRecord[] = [];

export async function withSpan<T>(
  name: string,
  attributes: Record<string, unknown>,
  callback: () => Promise<T>
): Promise<T> {
  if (!isObservabilityEnabled()) {
    return callback();
  }

  const parent = getCurrentContext();
  const spanId = createSpanId();
  const startedAt = performance.now();
  const startedAtIso = new Date().toISOString();

  return withObservabilityContext({
    trace_id: parent?.trace_id,
    span_id: spanId,
    execution_id: readString(attributes["phoenix.execution.id"]) ?? parent?.execution_id,
    publication_id: readString(attributes["phoenix.publication.id"]) ?? parent?.publication_id,
    scheduled_job_id: readString(attributes["phoenix.scheduler.job_id"]) ?? parent?.scheduled_job_id
  }, async () => {
    try {
      const result = await callback();
      finishSpan(name, startedAt, startedAtIso, "ok", attributes, parent?.span_id, spanId);
      return result;
    } catch (error) {
      finishSpan(name, startedAt, startedAtIso, "error", {
        ...attributes,
        error: error instanceof Error ? error.message : "Unknown error"
      }, parent?.span_id, spanId);
      throw error;
    }
  });
}

export function recordSpanEvent(name: string, attributes: Record<string, unknown> = {}): void {
  if (!isObservabilityEnabled()) return;

  const context = getCurrentContext();
  spans.push({
    name,
    trace_id: context?.trace_id ?? "",
    span_id: context?.span_id ?? "",
    started_at: new Date().toISOString(),
    duration_ms: 0,
    status: "ok",
    attributes: sanitizeAttributes(attributes)
  });
}

export function getRecentSpans(limit = 100): SpanRecord[] {
  return spans.slice(-limit);
}

function finishSpan(
  name: string,
  startedAt: number,
  startedAtIso: string,
  status: SpanStatus,
  attributes: Record<string, unknown>,
  parentSpanId: string | undefined,
  spanId: string
): void {
  const context = getCurrentContext();
  const durationMs = Math.round(performance.now() - startedAt);
  const span: SpanRecord = {
    name,
    trace_id: context?.trace_id ?? "",
    span_id: spanId,
    parent_span_id: parentSpanId,
    started_at: startedAtIso,
    duration_ms: durationMs,
    status,
    attributes: sanitizeAttributes(attributes)
  };

  spans.push(span);
  if (spans.length > 1000) spans.splice(0, spans.length - 1000);
  incrementCounter(`${name.replace(/\./g, "_")}_total`, { result: status });
  recordDuration(`${name.replace(/\./g, "_")}_duration_ms`, durationMs);

  if ((process.env.OTEL_TRACES_EXPORTER ?? "console") === "console") {
    console.log(JSON.stringify({ type: "span", ...span }));
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}
