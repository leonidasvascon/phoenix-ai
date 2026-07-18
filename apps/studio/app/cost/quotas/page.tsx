"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Quota = { id: string; workspace_id: string; requests_per_minute: number; tokens_per_hour: number; daily_cost: number; monthly_cost: number };

function QuotasView() {
  const queryClient = useQueryClient();
  const [dailyCost, setDailyCost] = useState("10");
  const quotas = useQuery({
    queryKey: ["cost-quotas"],
    queryFn: async (): Promise<Quota[]> => {
      const response = await apiFetch("/cost/quotas");
      if (!response.ok) throw new Error("Nao foi possivel carregar quotas.");
      return response.json();
    }
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch("/cost/quotas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace_id: "default-workspace", daily_cost: Number(dailyCost) }) });
      if (!response.ok) throw new Error("Nao foi possivel salvar quota.");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-quotas"] })
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Cost Intelligence</p><h1>Quotas</h1></section>
      <section className="settings-panel">
        <label>Custo diario USD<input value={dailyCost} onChange={(event) => setDailyCost(event.target.value)} /></label>
        <button onClick={() => mutation.mutate()}>{mutation.isPending ? "Salvando..." : "Salvar quota"}</button>
      </section>
      <section className="providers-grid">
        {quotas.data?.map((quota) => (
          <article className="provider-card" key={quota.id}>
            <header><div><p>Workspace</p><h2>{quota.workspace_id}</h2></div></header>
            <dl><div><dt>RPM</dt><dd>{quota.requests_per_minute}</dd></div><div><dt>Tokens/hora</dt><dd>{quota.tokens_per_hour}</dd></div><div><dt>Dia</dt><dd>${quota.daily_cost}</dd></div><div><dt>Mes</dt><dd>${quota.monthly_cost}</dd></div></dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function CostQuotasPage() {
  return <QueryProvider><QuotasView /></QueryProvider>;
}
