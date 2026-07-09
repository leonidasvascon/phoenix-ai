"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MetricCard } from "../../components/metric-card";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type AverageMetric = {
  name: string;
  average_score: number;
  count: number;
};

type CountMetric = {
  name: string;
  count: number;
};

type LearningRecommendation = {
  type: string;
  priority: "high" | "low" | "medium";
  message: string;
};

type LearningReport = {
  summary: {
    total_executions: number;
    average_score: number;
    success_rate: number;
  };
  analysis: {
    score_by_theme: AverageMetric[];
    score_by_brand: AverageMetric[];
    score_by_format: AverageMetric[];
    fallback_agents: CountMetric[];
    top_themes: CountMetric[];
    top_brands: CountMetric[];
    average_duration_by_format: AverageMetric[];
  };
  recommendations: LearningRecommendation[];
};

function LearningView() {
  const queryClient = useQueryClient();
  const learning = useQuery({
    queryKey: ["learning"],
    queryFn: async (): Promise<LearningReport> => {
      const response = await apiFetch("/learning");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar learning.");
      }

      return response.json();
    }
  });
  const analyze = useMutation({
    mutationFn: async (): Promise<LearningReport> => {
      const response = await apiFetch("/learning/analyze", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel analisar execucoes.");
      }

      return response.json();
    },
    onSuccess: (report) => {
      queryClient.setQueryData(["learning"], report);
    }
  });
  const report = analyze.data ?? learning.data;

  return (
    <main className="learning-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Learning</h1>
        </div>
        <button className="secondary-action" disabled={analyze.isPending} onClick={() => analyze.mutate()} type="button">
          {analyze.isPending ? "Analisando..." : "Analisar agora"}
        </button>
      </section>

      {learning.isLoading ? <p className="muted">Carregando aprendizado...</p> : null}
      {learning.error ? <p className="error">{learning.error.message}</p> : null}
      {analyze.error ? <p className="error">{analyze.error.message}</p> : null}

      {report ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Execucoes" value={report.summary.total_executions} />
            <MetricCard label="Score medio" value={report.summary.average_score} />
            <MetricCard label="Sucesso" value={`${report.summary.success_rate}%`} />
          </section>

          <section className="learning-layout">
            <article className="learning-panel recommendations-panel">
              <h2>Recomendacoes</h2>
              <div className="recommendation-list">
                {report.recommendations.map((recommendation, index) => (
                  <section className="recommendation-card" data-priority={recommendation.priority} key={`${recommendation.type}-${index}`}>
                    <span>{recommendation.priority}</span>
                    <p>{recommendation.message}</p>
                  </section>
                ))}
              </div>
            </article>

            <LearningAverageList title="Score por tema" items={report.analysis.score_by_theme} />
            <LearningAverageList title="Score por marca" items={report.analysis.score_by_brand} />
            <LearningAverageList title="Score por formato" items={report.analysis.score_by_format} />
            <LearningAverageList title="Tempo por formato" items={report.analysis.average_duration_by_format} suffix="ms" />
            <LearningCountList title="Fallbacks por agente" items={report.analysis.fallback_agents} empty="Nenhum fallback registrado." />
            <LearningCountList title="Temas mais usados" items={report.analysis.top_themes} />
            <LearningCountList title="Marcas mais usadas" items={report.analysis.top_brands} />
          </section>
        </>
      ) : null}
    </main>
  );
}

function LearningAverageList({ items, suffix = "", title }: { items: AverageMetric[]; suffix?: string; title: string }) {
  return (
    <article className="learning-panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <strong>
                {item.average_score}
                {suffix}
              </strong>
              <small>{item.count} exec.</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Sem dados suficientes.</p>
      )}
    </article>
  );
}

function LearningCountList({ empty = "Sem dados suficientes.", items, title }: { empty?: string; items: CountMetric[]; title: string }) {
  return (
    <article className="learning-panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </article>
  );
}

export default function LearningPage() {
  return (
    <QueryProvider>
      <LearningView />
    </QueryProvider>
  );
}
