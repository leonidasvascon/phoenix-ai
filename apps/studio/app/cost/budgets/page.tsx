"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Budget = { id: string; scope: string; scope_id: string; workspace_id: string; amount: number; spent: number; remaining: number; state: string };

function BudgetsView() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("25");
  const budgets = useQuery({
    queryKey: ["cost-budgets"],
    queryFn: async (): Promise<Budget[]> => {
      const response = await apiFetch("/cost/budgets");
      if (!response.ok) throw new Error("Nao foi possivel carregar budgets.");
      return response.json();
    }
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch("/cost/budgets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace_id: "default-workspace", amount: Number(amount) }) });
      if (!response.ok) throw new Error("Nao foi possivel salvar budget.");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-budgets"] })
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Cost Intelligence</p><h1>Budgets</h1></section>
      <section className="settings-panel">
        <label>Budget mensal USD<input value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <button onClick={() => mutation.mutate()}>{mutation.isPending ? "Salvando..." : "Salvar budget"}</button>
      </section>
      <section className="providers-grid">
        {budgets.data?.map((budget) => (
          <article className="provider-card" key={budget.id}>
            <header><div><p>{budget.scope}</p><h2>{budget.scope_id}</h2></div><span data-status={budget.state === "normal" ? "online" : "offline"}>{budget.state}</span></header>
            <dl><div><dt>Total</dt><dd>${budget.amount}</dd></div><div><dt>Usado</dt><dd>${budget.spent}</dd></div><div><dt>Restante</dt><dd>${budget.remaining}</dd></div></dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function CostBudgetsPage() {
  return <QueryProvider><BudgetsView /></QueryProvider>;
}
