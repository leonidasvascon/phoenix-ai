"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MetricCard } from "../../components/metric-card";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type EvaluationResult = {
  overall_score: number;
  dimensions: Record<string, number>;
  passed: boolean;
  threshold: number;
  reasons: string[];
};

type BenchmarkResult = {
  id: string;
  category: string;
  min_score: number;
  evaluation: EvaluationResult;
  passed: boolean;
};

type RegressionResult = {
  execution_id: string;
  evaluation: EvaluationResult;
  passed: boolean;
};

type EvaluationReport = {
  id: string;
  generated_at: string;
  summary: {
    benchmark_count: number;
    benchmark_passed: number;
    regression_count: number;
    regression_passed: number;
    average_overall_score: number;
    failed_content_count: number;
  };
  dimensions: Record<string, number>;
  benchmarks: BenchmarkResult[];
  regressions: RegressionResult[];
  failed_content: RegressionResult[];
};

type EmptyEvaluation = {
  status: "empty";
  message: string;
};

function EvaluationView() {
  const queryClient = useQueryClient();
  const evaluation = useQuery({
    queryKey: ["evaluation"],
    queryFn: async (): Promise<EvaluationReport | EmptyEvaluation> => {
      const response = await apiFetch("/evaluation");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar evaluation.");
      }

      return response.json();
    }
  });
  const run = useMutation({
    mutationFn: async (): Promise<EvaluationReport> => {
      const response = await apiFetch("/evaluation/run", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel executar evaluation.");
      }

      return response.json();
    },
    onSuccess: (report) => {
      queryClient.setQueryData(["evaluation"], report);
    }
  });
  const report = isEvaluationReport(run.data) ? run.data : isEvaluationReport(evaluation.data) ? evaluation.data : null;

  return (
    <main className="evaluation-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Evaluation</h1>
        </div>
        <button className="secondary-action" disabled={run.isPending} onClick={() => run.mutate()} type="button">
          {run.isPending ? "Avaliando..." : "Rodar evaluation"}
        </button>
      </section>

      {evaluation.isLoading ? <p className="muted">Carregando avaliacoes...</p> : null}
      {evaluation.error ? <p className="error">{evaluation.error.message}</p> : null}
      {run.error ? <p className="error">{run.error.message}</p> : null}

      {!report && !evaluation.isLoading ? (
        <section className="empty-state">
          <h2>Nenhuma evaluation gerada</h2>
          <p>Execute a primeira avaliacao para medir benchmarks, regressao e qualidade por dimensao.</p>
        </section>
      ) : null}

      {report ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Score medio" value={report.summary.average_overall_score} />
            <MetricCard label="Benchmarks" value={`${report.summary.benchmark_passed}/${report.summary.benchmark_count}`} />
            <MetricCard label="Regressoes" value={`${report.summary.regression_passed}/${report.summary.regression_count}`} />
            <MetricCard label="Reprovados" value={report.summary.failed_content_count} />
            <MetricCard label="Gerado em" value={new Date(report.generated_at).toLocaleString("pt-BR")} />
          </section>

          <section className="evaluation-layout">
            <DimensionPanel dimensions={report.dimensions} />
            <BenchmarkPanel benchmarks={report.benchmarks} />
            <RegressionPanel regressions={report.regressions} />
            <FailedContentPanel items={report.failed_content} />
          </section>
        </>
      ) : null}
    </main>
  );
}

function DimensionPanel({ dimensions }: { dimensions: Record<string, number> }) {
  return (
    <article className="evaluation-panel">
      <h2>Score por dimensao</h2>
      {Object.keys(dimensions).length > 0 ? (
        <ul className="evaluation-list">
          {Object.entries(dimensions).map(([dimension, score]) => (
            <li key={dimension}>
              <span>{formatLabel(dimension)}</span>
              <strong>{score}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Sem execucoes suficientes para media dimensional.</p>
      )}
    </article>
  );
}

function BenchmarkPanel({ benchmarks }: { benchmarks: BenchmarkResult[] }) {
  return (
    <article className="evaluation-panel">
      <h2>Benchmarks</h2>
      {benchmarks.length > 0 ? (
        <div className="evaluation-card-list">
          {benchmarks.map((benchmark) => (
            <section className="evaluation-card" data-status={benchmark.passed ? "passed" : "failed"} key={benchmark.id}>
              <header>
                <div>
                  <p>{benchmark.category}</p>
                  <h3>{benchmark.id}</h3>
                </div>
                <span>{benchmark.passed ? "passou" : "falhou"}</span>
              </header>
              <dl>
                <div>
                  <dt>Score</dt>
                  <dd>{benchmark.evaluation.overall_score}</dd>
                </div>
                <div>
                  <dt>Minimo</dt>
                  <dd>{benchmark.min_score}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum benchmark cadastrado.</p>
      )}
    </article>
  );
}

function RegressionPanel({ regressions }: { regressions: RegressionResult[] }) {
  return (
    <article className="evaluation-panel">
      <h2>Regressao</h2>
      {regressions.length > 0 ? (
        <ul className="evaluation-list">
          {regressions.slice(0, 12).map((regression) => (
            <li key={regression.execution_id}>
              <span>{regression.execution_id}</span>
              <strong>{regression.evaluation.overall_score}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Sem execucoes persistidas para regressao.</p>
      )}
    </article>
  );
}

function FailedContentPanel({ items }: { items: RegressionResult[] }) {
  return (
    <article className="evaluation-panel">
      <h2>Conteudos reprovados</h2>
      {items.length > 0 ? (
        <div className="evaluation-card-list">
          {items.map((item) => (
            <section className="evaluation-card" data-status="failed" key={item.execution_id}>
              <header>
                <div>
                  <p>Execution</p>
                  <h3>{item.execution_id}</h3>
                </div>
                <span>{item.evaluation.overall_score}</span>
              </header>
              <ul>
                {item.evaluation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum conteudo reprovado no ultimo relatorio.</p>
      )}
    </article>
  );
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function isEvaluationReport(value: unknown): value is EvaluationReport {
  return Boolean(value && typeof value === "object" && "summary" in value && "benchmarks" in value);
}

export default function EvaluationPage() {
  return (
    <QueryProvider>
      <EvaluationView />
    </QueryProvider>
  );
}
