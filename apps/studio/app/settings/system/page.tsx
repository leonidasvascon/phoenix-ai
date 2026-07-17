"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

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
  scheduler: {
    worker_enabled: boolean;
    total_jobs: number;
  };
  publishing: {
    provider: string;
    dry_run: boolean;
  };
  observability: {
    enabled: boolean;
    service_name: string;
  };
  evaluation: {
    latest_quality_status: string;
    latest_average_score: number | null;
  };
  config: {
    valid: boolean;
    mode: string;
    missing: string[];
  };
};

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="output-block">{JSON.stringify(value, null, 2)}</pre>;
}

function SystemSettingsView() {
  const version = useQuery({
    queryKey: ["system-version"],
    queryFn: async (): Promise<VersionInfo> => {
      const response = await apiFetch("/version");
      if (!response.ok) {
        throw new Error("Nao foi possivel carregar versao.");
      }
      return response.json();
    }
  });

  const health = useQuery({
    queryKey: ["system-health-details"],
    queryFn: async (): Promise<HealthDetails> => {
      const response = await apiFetch("/health/details");
      if (!response.ok) {
        throw new Error("Nao foi possivel carregar health details.");
      }
      return response.json();
    }
  });

  return (
    <main className="settings-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Sistema</h1>
      </section>

      {version.error ? <p className="error">{version.error.message}</p> : null}
      {health.error ? <p className="error">{health.error.message}</p> : null}

      <section className="settings-form">
        <section>
          <h2>Release</h2>
          {version.data ? (
            <div className="metric-grid">
              <article>
                <span>Versao</span>
                <strong>{version.data.version}</strong>
              </article>
              <article>
                <span>Ambiente</span>
                <strong>{version.data.environment}</strong>
              </article>
              <article>
                <span>Commit</span>
                <strong>{version.data.commit}</strong>
              </article>
              <article>
                <span>Node</span>
                <strong>{version.data.node}</strong>
              </article>
            </div>
          ) : (
            <p className="muted">Carregando versao...</p>
          )}
        </section>

        <section>
          <h2>Status geral</h2>
          {health.data ? (
            <div className="metric-grid">
              <article>
                <span>Health</span>
                <strong>{health.data.status}</strong>
              </article>
              <article>
                <span>Storage</span>
                <strong>{health.data.storage}</strong>
              </article>
              <article>
                <span>Scheduler</span>
                <strong>{health.data.scheduler.worker_enabled ? "worker ativo" : "manual"}</strong>
              </article>
              <article>
                <span>Config</span>
                <strong>{health.data.config.valid ? "valida" : "incompleta"}</strong>
              </article>
            </div>
          ) : (
            <p className="muted">Carregando status...</p>
          )}
        </section>

        <section>
          <h2>Operacao local</h2>
          <p className="muted">Comandos disponiveis no ambiente do projeto.</p>
          <JsonBlock
            value={{
              backup: "pnpm run backup",
              restore: "pnpm run restore -- .storage/backups/<arquivo>.json --yes",
              integrity: "pnpm run integrity:check",
              diagnostics: "pnpm run diagnostics",
              docker: "docker compose up --build"
            }}
          />
        </section>

        <section>
          <h2>Diagnostico</h2>
          {health.data ? <JsonBlock value={health.data} /> : <p className="muted">Aguardando health details...</p>}
        </section>
      </section>
    </main>
  );
}

export default function SystemSettingsPage() {
  return (
    <QueryProvider>
      <SystemSettingsView />
    </QueryProvider>
  );
}
