"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type VersionInfo = {
  version: string;
  commit: string;
  build_date: string;
  node: string;
  environment: string;
};

type HealthDetails = {
  status: string;
  storage: string;
  runtime_settings: string;
  providers: unknown;
  scheduler: { worker_enabled: boolean; total_jobs: number };
  publishing: { provider: string; dry_run: boolean };
  observability: { enabled: boolean; service_name: string };
  evaluation: { latest_quality_status: string; latest_average_score: number | null };
  config: { valid: boolean; mode: string; missing: string[] };
};

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="output-block">{JSON.stringify(value, null, 2)}</pre>;
}

function SystemView() {
  const version = useQuery({
    queryKey: ["system-page-version"],
    queryFn: async (): Promise<VersionInfo> => {
      const response = await apiFetch("/version");
      if (!response.ok) throw new Error("Nao foi possivel carregar a versao.");
      return response.json();
    }
  });
  const health = useQuery({
    queryKey: ["system-page-health"],
    queryFn: async (): Promise<HealthDetails> => {
      const response = await apiFetch("/health/details");
      if (!response.ok) throw new Error("Nao foi possivel carregar o health details.");
      return response.json();
    }
  });

  return (
    <main className="operations-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix AI</p>
          <h1>System</h1>
        </div>
        <div className="heading-actions">
          <Link href="/operations">Operacoes</Link>
          <Link href="/developers">Developers</Link>
        </div>
      </section>

      {version.error ? <p className="error">{version.error.message}</p> : null}
      {health.error ? <p className="error">{health.error.message}</p> : null}

      <section className="operations-grid">
        <article className="health-status-card" data-status={health.data?.status ?? "loading"}>
          <p>Status geral</p>
          <strong>{health.data?.status ?? "..."}</strong>
          <span>Health consolidado da API e dos componentes essenciais.</span>
        </article>
        <article className="operational-metric-card">
          <p>Versao</p>
          <strong>{version.data?.version ?? "..."}</strong>
        </article>
        <article className="operational-metric-card">
          <p>Ambiente</p>
          <strong>{version.data?.environment ?? "..."}</strong>
        </article>
      </section>

      <section className="evaluation-layout">
        <article className="operations-panel">
          <h2>Componentes</h2>
          {health.data ? (
            <ul className="operations-list">
              <li><strong>Storage</strong><span>{health.data.storage}</span><small>Persistencia local</small></li>
              <li><strong>Scheduler</strong><span>{health.data.scheduler.worker_enabled ? "ativo" : "manual"}</span><small>{health.data.scheduler.total_jobs} jobs</small></li>
              <li><strong>Publishing</strong><span>{health.data.publishing.provider}</span><small>{health.data.publishing.dry_run ? "dry-run" : "real"}</small></li>
              <li><strong>Observability</strong><span>{health.data.observability.enabled ? "ativa" : "desativada"}</span><small>{health.data.observability.service_name}</small></li>
              <li><strong>Evaluation</strong><span>{health.data.evaluation.latest_quality_status}</span><small>{health.data.evaluation.latest_average_score ?? "sem score"}</small></li>
            </ul>
          ) : <p className="muted">Carregando componentes...</p>}
        </article>

        <article className="operations-panel">
          <h2>Comandos RC</h2>
          <JsonBlock value={{
            preflight: "pnpm run preflight",
            health: "pnpm run health-check",
            backup: "pnpm run backup-all",
            restore: "pnpm run restore-all -- .storage/backups/<arquivo>.json --yes",
            post_upgrade: "pnpm run post-upgrade",
            diagnostics: "pnpm run diagnostics"
          }} />
        </article>

        <article className="operations-panel evaluation-panel-wide">
          <h2>Diagnostico consolidado</h2>
          {health.data ? <JsonBlock value={{ version: version.data, health: health.data }} /> : <p className="muted">Aguardando diagnostico...</p>}
        </article>
      </section>
    </main>
  );
}

export default function SystemPage() {
  return (
    <QueryProvider>
      <SystemView />
    </QueryProvider>
  );
}
