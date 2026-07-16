import { getMetricsSnapshot } from "./metrics.ts";
import { getRecentSpans } from "./tracer.ts";

export function isObservabilityEnabled(): boolean {
  return (process.env.PHOENIX_OBSERVABILITY_ENABLED ?? "true") !== "false";
}

export function serviceName(): string {
  return process.env.PHOENIX_SERVICE_NAME ?? "phoenix-api";
}

export function getObservabilityStatus() {
  return {
    enabled: isObservabilityEnabled(),
    service_name: serviceName(),
    log_level: process.env.PHOENIX_LOG_LEVEL ?? "info",
    trace_content: process.env.PHOENIX_TRACE_CONTENT === "true",
    traces_exporter: process.env.OTEL_TRACES_EXPORTER ?? "console",
    metrics_exporter: process.env.OTEL_METRICS_EXPORTER ?? "console",
    otlp_endpoint_configured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    spans_recorded: getRecentSpans().length,
    metrics: getMetricsSnapshot()
  };
}
