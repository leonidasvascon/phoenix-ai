"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Usage = { id: string; timestamp: string; provider: string; model: string; kind: string; total_tokens: number; consolidated_cost: number; cache_hit: boolean; policy?: string };

function CostUsageView() {
  const usage = useQuery({
    queryKey: ["cost-usage"],
    queryFn: async (): Promise<Usage[]> => {
      const response = await apiFetch("/cost/usage");
      if (!response.ok) throw new Error("Nao foi possivel carregar usage.");
      return response.json();
    }
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Cost Intelligence</p><h1>Usage</h1></section>
      <section className="providers-grid">
        {usage.data?.slice(-40).reverse().map((item) => (
          <article className="provider-card" key={item.id}>
            <header><div><p>{item.provider}</p><h2>{item.model}</h2></div><span data-status={item.cache_hit ? "online" : "offline"}>{item.cache_hit ? "cache" : "miss"}</span></header>
            <dl>
              <div><dt>Tipo</dt><dd>{item.kind}</dd></div>
              <div><dt>Tokens</dt><dd>{item.total_tokens}</dd></div>
              <div><dt>Custo</dt><dd>${item.consolidated_cost}</dd></div>
              <div><dt>Politica</dt><dd>{item.policy ?? "-"}</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function CostUsagePage() {
  return <QueryProvider><CostUsageView /></QueryProvider>;
}
