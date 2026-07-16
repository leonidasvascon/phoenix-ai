"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HealthStatusCard } from "../../components/health-status-card";
import { Navigation } from "../../components/navigation";
import { OperationalMetricCard } from "../../components/operational-metric-card";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type MetricPoint = {
  name: string;
  value: number;
  labels: Record<string, string | number | boolean>;
};

type HealthResponse = {
  status: string;
  errors?: string[];
};

type ObservabilityStatus = {
  enabled: boolean;
  service_name: string;
  traces_exporter: string;
  metrics_exporter: string;
  spans_recorded: number;
};

type MetricsResponse = {
  counters: MetricPoint[];
  gauges: MetricPoint[];
  histograms: Array<{ name: string; count: number; average: number; max: number; labels: Record<string, string | number | boolean> }>;
};

type OperationsData = {
  live: HealthResponse;
  ready: HealthResponse;
  observability: ObservabilityStatus;
  metrics: MetricsResponse;
};

function OperationsView() {
  const operations = useQuery({
    queryKey: ["operations"],
    queryFn: async (): Promise<OperationsData> => {
      const [live, ready, observability, metrics] = await Promise.all([
        apiFetch("/health/live"),
        apiFetch("/health/ready"),
        apiFetch("/observability/status"),
        apiFetch("/metrics")
      ]);

      return {
        live: await live.json(),
        ready: await ready.json(),
        observability: await observability.json(),
        metrics: await metrics.json()
      };
    },
    refetchInterval: 15000
  });
  const metrics = operations.data?.metrics;

  return (
    <main className="operations-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Operacoes</h1>
        </div>
        <Link className="secondary-action" href="/evaluation/history">
          Historico de qualidade
        </Link>
      </section>

      {operations.isLoading ? <p className="muted">Carregando operacao...</p> : null}
      {operations.error ? <p className="error">{operations.error.message}</p> : null}

      {operations.data ? (
        <>
          <section className="operations-grid">
            <HealthStatusCard label="API live" message="Processo respondendo" status={operations.data.live.status} />
            <HealthStatusCard
              label="API ready"
              message={operations.data.ready.errors?.join("; ") || "Dependencias minimas OK"}
              status={operations.data.ready.status}
            />
            <HealthStatusCard
              label="Observabilidade"
              message={`${operations.data.observability.traces_exporter}/${operations.data.observability.metrics_exporter}`}
              status={operations.data.observability.enabled ? "enabled" : "disabled"}
            />
          </section>

          <section className="operations-grid">
            <OperationalMetricCard label="Execucoes Runtime" value={sumCounter(metrics, "phoenix_runtime_executions_total")} />
            <OperationalMetricCard label="Falhas de agentes" value={sumCounter(metrics, "phoenix_agent_failures_total")} />
            <OperationalMetricCard label="Fallbacks provider" value={sumCounter(metrics, "phoenix_provider_fallbacks_total")} />
            <OperationalMetricCard label="Jobs scheduler" value={sumCounter(metrics, "phoenix_scheduler_jobs_total")} />
            <OperationalMetricCard label="Publicacoes com erro" value={sumCounter(metrics, "phoenix_publications_total", "failed")} />
            <OperationalMetricCard label="Spans recentes" value={operations.data.observability.spans_recorded} />
          </section>

          <section className="operations-panel">
            <h2>Metricas recentes</h2>
            {metrics?.counters.length ? (
              <ul className="operations-list">
                {metrics.counters.slice(0, 18).map((metric, index) => (
                  <li key={`${metric.name}-${index}`}>
                    <span>{metric.name}</span>
                    <strong>{metric.value}</strong>
                    <small>{formatLabels(metric.labels)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">As metricas aparecem conforme a API executa tarefas.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function sumCounter(metrics: MetricsResponse | undefined, name: string, result?: string): number {
  return metrics?.counters
    .filter((metric) => metric.name === name && (!result || metric.labels.result === result))
    .reduce((sum, metric) => sum + metric.value, 0) ?? 0;
}

function formatLabels(labels: Record<string, string | number | boolean>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(" | ");
}

export default function OperationsPage() {
  return (
    <QueryProvider>
      <OperationsView />
    </QueryProvider>
  );
}
