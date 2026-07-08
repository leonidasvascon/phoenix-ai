"use client";

import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/metric-card";
import { Navigation } from "../../components/navigation";
import { QueryProvider } from "../query-provider";
import { apiFetch } from "../api-client";

type RankedMetric = {
  name: string;
  count: number;
};

type AnalyticsReport = {
  total_executions: number;
  success_executions: number;
  success_rate: number;
  fallback_executions: number;
  average_score: number;
  average_duration_ms: number;
  estimated_total_cost: number;
  top_failed_agents: RankedMetric[];
  top_themes: string[];
  top_brands: string[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency"
  }).format(value);
}

function AnalyticsView() {
  const analytics = useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsReport> => {
      const response = await apiFetch("/analytics");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar analytics.");
      }

      return response.json();
    }
  });

  return (
    <main className="analytics-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Analytics</h1>
      </section>

      {analytics.isLoading ? <p className="muted">Carregando analytics...</p> : null}
      {analytics.error ? <p className="error">{analytics.error.message}</p> : null}
      {analytics.data ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Total de execucoes" value={analytics.data.total_executions} />
            <MetricCard label="Taxa de sucesso" value={`${analytics.data.success_rate}%`} />
            <MetricCard label="Score medio" value={analytics.data.average_score} />
            <MetricCard label="Tempo medio" value={`${analytics.data.average_duration_ms}ms`} />
            <MetricCard label="Custo estimado" value={formatCurrency(analytics.data.estimated_total_cost)} />
          </section>

          <section className="analytics-lists">
            <article>
              <h2>Agentes com mais falhas</h2>
              {analytics.data.top_failed_agents.length > 0 ? (
                <ul>
                  {analytics.data.top_failed_agents.map((agent) => (
                    <li key={agent.name}>
                      <span>{agent.name}</span>
                      <strong>{agent.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhuma falha registrada.</p>
              )}
            </article>

            <article>
              <h2>Temas mais usados</h2>
              {analytics.data.top_themes.length > 0 ? (
                <ul>
                  {analytics.data.top_themes.map((theme) => (
                    <li key={theme}>{theme}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhum tema registrado.</p>
              )}
            </article>

            <article>
              <h2>Marcas mais usadas</h2>
              {analytics.data.top_brands.length > 0 ? (
                <ul>
                  {analytics.data.top_brands.map((brand) => (
                    <li key={brand}>{brand}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhuma marca registrada.</p>
              )}
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default function AnalyticsPage() {
  return (
    <QueryProvider>
      <AnalyticsView />
    </QueryProvider>
  );
}
