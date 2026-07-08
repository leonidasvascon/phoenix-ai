"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Navigation } from "../../../components/navigation";
import { OutputPreview, type OutputPackage } from "../../../components/output-preview";
import { QueryProvider } from "../../query-provider";
import { apiFetch } from "../../api-client";

function ExecutionDetailView() {
  const params = useParams<{ id: string }>();
  const executionId = params.id;
  const outputPackage = useQuery({
    enabled: Boolean(executionId),
    queryKey: ["execution", executionId],
    queryFn: async (): Promise<OutputPackage> => {
      const response = await apiFetch(`/executions/${executionId}`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar o pacote gerado.");
      }

      return response.json();
    }
  });

  return (
    <main className="output-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Preview do pacote</h1>
      </section>

      {outputPackage.isLoading ? <p className="muted">Carregando pacote...</p> : null}
      {outputPackage.error ? <p className="error">{outputPackage.error.message}</p> : null}
      {outputPackage.data ? <OutputPreview outputPackage={outputPackage.data} /> : null}
    </main>
  );
}

export default function ExecutionDetailPage() {
  return (
    <QueryProvider>
      <ExecutionDetailView />
    </QueryProvider>
  );
}
