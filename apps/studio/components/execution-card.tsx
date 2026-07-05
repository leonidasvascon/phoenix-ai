"use client";

export type ExecutionCardData = {
  status: "success" | "error";
  execution_id: string;
  score: number;
  pipeline: string[];
  logs: Array<{
    timestamp: string;
  }>;
  execution: {
    provider: string;
    duration_ms: number;
    agents: Array<{
      provider: string;
    }>;
    task?: {
      brand: string;
      theme: string;
      format: string;
    };
    storage?: string;
  };
  media_package?: {
    directory: string;
    files: string[];
  };
};

function formatDate(value?: string): string {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function hasFallback(execution: ExecutionCardData): boolean {
  return execution.execution.agents.some((agent) => agent.provider === "mock") && execution.execution.provider !== "mock";
}

export function ExecutionCard({ execution }: Readonly<{ execution: ExecutionCardData }>) {
  const outputPath = execution.media_package?.directory ?? execution.execution.storage ?? "-";

  async function copyOutputPath() {
    await navigator.clipboard.writeText(outputPath);
  }

  return (
    <article className="execution-card">
      <header>
        <div>
          <p>{formatDate(execution.logs[0]?.timestamp)}</p>
          <h2>{execution.execution.task?.theme ?? "Tema nao informado"}</h2>
        </div>
        <span data-status={execution.status}>{execution.status}</span>
      </header>

      <dl>
        <div>
          <dt>Marca</dt>
          <dd>{execution.execution.task?.brand ?? "-"}</dd>
        </div>
        <div>
          <dt>Formato</dt>
          <dd>{execution.execution.task?.format ?? "-"}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{execution.score}</dd>
        </div>
        <div>
          <dt>Fallback</dt>
          <dd>{hasFallback(execution) ? "Sim" : "Nao"}</dd>
        </div>
      </dl>

      <footer>
        <code>{outputPath}</code>
        <button type="button" onClick={copyOutputPath}>
          Copiar caminho
        </button>
      </footer>
    </article>
  );
}
