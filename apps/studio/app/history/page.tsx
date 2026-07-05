"use client";

import { useQuery } from "@tanstack/react-query";
import { ExecutionCard, type ExecutionCardData } from "../../components/execution-card";
import { Navigation } from "../../components/navigation";
import { QueryProvider } from "../query-provider";

const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

function HistoryView() {
  const executions = useQuery({
    queryKey: ["executions"],
    queryFn: async (): Promise<ExecutionCardData[]> => {
      const response = await fetch(`${apiUrl}/executions`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar o historico.");
      }

      return response.json();
    }
  });

  return (
    <main className="history-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Historico de execucoes</h1>
      </section>

      {executions.isLoading ? <p className="muted">Carregando historico...</p> : null}
      {executions.error ? <p className="error">{executions.error.message}</p> : null}
      {executions.data?.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhuma execucao encontrada</h2>
          <p>Gere a primeira task para iniciar o historico operacional.</p>
        </section>
      ) : null}
      {executions.data && executions.data.length > 0 ? (
        <section className="execution-list">
          {executions.data.map((execution) => (
            <ExecutionCard execution={execution} key={execution.execution_id} />
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default function HistoryPage() {
  return (
    <QueryProvider>
      <HistoryView />
    </QueryProvider>
  );
}
