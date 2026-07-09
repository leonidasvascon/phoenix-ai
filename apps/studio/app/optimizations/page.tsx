"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type PromptOptimization = {
  id: string;
  brand_id: string;
  agent: string;
  instruction: string;
  source: string;
  active: boolean;
  created_at: string;
};

function OptimizationsView() {
  const queryClient = useQueryClient();
  const optimizations = useQuery({
    queryKey: ["prompt-optimizations"],
    queryFn: async (): Promise<PromptOptimization[]> => {
      const response = await apiFetch("/prompt-optimizations");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar otimizacoes.");
      }

      return response.json();
    }
  });
  const generate = useMutation({
    mutationFn: async (): Promise<PromptOptimization[]> => {
      const response = await apiFetch("/prompt-optimizations/generate", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel gerar otimizacoes.");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["prompt-optimizations"], data);
    }
  });
  const activeOptimizations = optimizations.data?.filter((optimization) => optimization.active) ?? [];

  return (
    <main className="optimizations-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Otimizacoes</h1>
        </div>
        <button className="secondary-action" disabled={generate.isPending} onClick={() => generate.mutate()} type="button">
          {generate.isPending ? "Gerando..." : "Gerar otimizacoes"}
        </button>
      </section>

      {optimizations.isLoading ? <p className="muted">Carregando otimizacoes...</p> : null}
      {optimizations.error ? <p className="error">{optimizations.error.message}</p> : null}
      {generate.error ? <p className="error">{generate.error.message}</p> : null}

      <section className="optimizations-grid">
        {activeOptimizations.length === 0 && !optimizations.isLoading ? (
          <article className="optimization-card empty-state">
            <h2>Nenhuma otimizacao ativa</h2>
            <p>Gere otimizacoes para transformar dados reais em instrucoes praticas para os agentes.</p>
          </article>
        ) : null}

        {activeOptimizations.map((optimization) => (
          <article className="optimization-card" key={optimization.id}>
            <header>
              <div>
                <span>{optimization.source}</span>
                <h2>{optimization.agent}</h2>
              </div>
              <strong>{optimization.brand_id}</strong>
            </header>
            <p>{optimization.instruction}</p>
            <footer>
              <span>{optimization.active ? "Ativa" : "Inativa"}</span>
              <time dateTime={optimization.created_at}>{new Date(optimization.created_at).toLocaleString("pt-BR")}</time>
            </footer>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function OptimizationsPage() {
  return (
    <QueryProvider>
      <OptimizationsView />
    </QueryProvider>
  );
}
