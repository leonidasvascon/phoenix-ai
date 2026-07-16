"use client";

import Link from "next/link";
import { MetricCard } from "../../../components/metric-card";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";
import { useQuery } from "@tanstack/react-query";

type QualityReport = {
  id: string;
  generated_at: string;
  average_score: number;
  benchmarks: {
    passed: number;
    failed: number;
    total: number;
    pass_rate: number;
  };
  regressions: {
    passed: number;
    failed: number;
    total: number;
  };
  status: "FAIL" | "PASS";
  failures: string[];
};

type QualityHistoryItem = {
  date: string;
  file: string;
  generated_at: string;
  average_score: number;
  status: "FAIL" | "PASS";
  benchmarks: QualityReport["benchmarks"];
  regressions: QualityReport["regressions"];
};

type QualityHistoryResponse = {
  latest: QualityReport | null;
  history: QualityHistoryItem[];
};

function EvaluationHistoryView() {
  const quality = useQuery({
    queryKey: ["quality-history"],
    queryFn: async (): Promise<QualityHistoryResponse> => {
      const response = await apiFetch("/quality");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar historico de qualidade.");
      }

      return response.json();
    }
  });
  const latest = quality.data?.latest ?? null;
  const history = quality.data?.history ?? [];

  return (
    <main className="evaluation-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Evaluation History</h1>
        </div>
        <Link className="secondary-action" href="/evaluation">
          Voltar
        </Link>
      </section>

      {quality.isLoading ? <p className="muted">Carregando historico...</p> : null}
      {quality.error ? <p className="error">{quality.error.message}</p> : null}

      {latest ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Status" value={latest.status} />
            <MetricCard label="Score medio" value={latest.average_score} />
            <MetricCard label="Benchmarks" value={`${latest.benchmarks.passed}/${latest.benchmarks.total}`} />
            <MetricCard label="Regressoes" value={`${latest.regressions.passed}/${latest.regressions.total}`} />
            <MetricCard label="Falhas" value={latest.regressions.failed + latest.benchmarks.failed} />
          </section>

          <section className="evaluation-layout">
            <article className="evaluation-panel">
              <h2>Ultimo relatorio</h2>
              <ul className="evaluation-list">
                <li>
                  <span>Gerado em</span>
                  <strong>{new Date(latest.generated_at).toLocaleString("pt-BR")}</strong>
                </li>
                <li>
                  <span>Benchmark pass rate</span>
                  <strong>{latest.benchmarks.pass_rate}%</strong>
                </li>
                <li>
                  <span>Regressoes detectadas</span>
                  <strong>{latest.regressions.failed}</strong>
                </li>
              </ul>
            </article>

            <article className="evaluation-panel">
              <h2>Falhas do gate</h2>
              {latest.failures.length > 0 ? (
                <ul className="evaluation-list">
                  {latest.failures.map((failure) => (
                    <li key={failure}>
                      <span>{failure}</span>
                      <strong>FAIL</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nenhuma falha no ultimo relatorio.</p>
              )}
            </article>

            <article className="evaluation-panel evaluation-panel-wide">
              <h2>Evolucao do score medio</h2>
              {history.length > 0 ? (
                <div className="quality-timeline">
                  {history.map((item) => (
                    <section className="quality-timeline-item" data-status={item.status} key={item.file}>
                      <span>{item.date}</span>
                      <strong>{item.average_score}</strong>
                      <small>
                        {item.status} | benchmarks {item.benchmarks.passed}/{item.benchmarks.total} | regressoes {item.regressions.failed}
                      </small>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="muted">O historico sera preenchido conforme o Quality Pipeline gerar relatorios.</p>
              )}
            </article>
          </section>
        </>
      ) : !quality.isLoading ? (
        <section className="empty-state">
          <h2>Nenhum relatorio encontrado</h2>
          <p>Execute `pnpm run quality:report` para gerar o primeiro relatorio de qualidade.</p>
        </section>
      ) : null}
    </main>
  );
}

export default function EvaluationHistoryPage() {
  return (
    <QueryProvider>
      <EvaluationHistoryView />
    </QueryProvider>
  );
}
