import { getCurrentContext } from "./context.ts";
import { sanitize } from "./sanitization.ts";
import { isObservabilityEnabled, serviceName } from "./telemetry.ts";

type LogLevel = "debug" | "error" | "info" | "warn";

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export function logStructured(level: LogLevel, event: string, payload: Record<string, unknown> = {}): void {
  if (!isObservabilityEnabled()) return;
  if (levels[level] < levels[getLogLevel()]) return;

  const context = getCurrentContext();
  const entry = sanitize({
    timestamp: new Date().toISOString(),
    level,
    service: serviceName(),
    event,
    trace_id: context?.trace_id,
    span_id: context?.span_id,
    execution_id: context?.execution_id,
    publication_id: context?.publication_id,
    scheduled_job_id: context?.scheduled_job_id,
    ...payload
  });

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
}

function getLogLevel(): LogLevel {
  const level = process.env.PHOENIX_LOG_LEVEL as LogLevel | undefined;

  return level && level in levels ? level : "info";
}
