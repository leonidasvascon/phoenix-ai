"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type CacheEntry = { id: string; provider: string; model: string; kind: string; hits: number; estimated_savings: number; updated_at: string };

function CacheView() {
  const queryClient = useQueryClient();
  const cache = useQuery({
    queryKey: ["cost-cache"],
    queryFn: async (): Promise<CacheEntry[]> => {
      const response = await apiFetch("/cost/cache");
      if (!response.ok) throw new Error("Nao foi possivel carregar cache.");
      return response.json();
    }
  });
  const clear = useMutation({
    mutationFn: async () => {
      const response = await apiFetch("/cost/cache/clear", { method: "POST" });
      if (!response.ok) throw new Error("Nao foi possivel limpar cache.");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-cache"] })
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Cost Intelligence</p><h1>Semantic Cache</h1><button onClick={() => clear.mutate()}>{clear.isPending ? "Limpando..." : "Limpar cache"}</button></section>
      <section className="providers-grid">
        {cache.data?.map((entry) => (
          <article className="provider-card" key={entry.id}>
            <header><div><p>{entry.provider}</p><h2>{entry.model}</h2></div><span data-status="online">{entry.hits} hits</span></header>
            <dl><div><dt>Tipo</dt><dd>{entry.kind}</dd></div><div><dt>Economia</dt><dd>${entry.estimated_savings}</dd></div><div><dt>Atualizado</dt><dd>{entry.updated_at}</dd></div></dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function CostCachePage() {
  return <QueryProvider><CacheView /></QueryProvider>;
}
