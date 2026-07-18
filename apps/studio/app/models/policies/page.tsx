"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Policy = { workspace_id: string; default_policy: string; fallback_order: string[]; task_policies: Record<string, string>; preferred_models: Record<string, string> };

function ModelPoliciesView() {
  const queryClient = useQueryClient();
  const policies = useQuery({
    queryKey: ["model-policies"],
    queryFn: async (): Promise<Policy[]> => {
      const response = await apiFetch("/models/policies");
      if (!response.ok) throw new Error("Nao foi possivel carregar politicas.");
      return response.json();
    }
  });
  const current = policies.data?.[0];
  const [defaultPolicy, setDefaultPolicy] = useState("fallback");
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch("/models/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: current?.workspace_id ?? "default-workspace", default_policy: defaultPolicy })
      });
      if (!response.ok) throw new Error("Nao foi possivel salvar politica.");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["model-policies"] })
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Phoenix Studio</p><h1>Model Policies</h1></section>
      <section className="settings-panel">
        <label>
          Politica padrao
          <select value={defaultPolicy} onChange={(event) => setDefaultPolicy(event.target.value)}>
            <option value="fallback">Fallback automatico</option>
            <option value="lowest_cost">Menor custo</option>
            <option value="highest_quality">Maior qualidade</option>
            <option value="lowest_latency">Menor latencia</option>
            <option value="task_affinity">Afinidade por tarefa</option>
          </select>
        </label>
        <button onClick={() => mutation.mutate()}>{mutation.isPending ? "Salvando..." : "Salvar politica"}</button>
      </section>
      <section className="providers-grid">
        {policies.data?.map((policy) => (
          <article className="provider-card" key={policy.workspace_id}>
            <header><div><p>Workspace</p><h2>{policy.workspace_id}</h2></div></header>
            <dl>
              <div><dt>Padrao</dt><dd>{policy.default_policy}</dd></div>
              <div><dt>Fallback</dt><dd>{policy.fallback_order.join(" -> ")}</dd></div>
              <div><dt>Tarefas</dt><dd>{Object.keys(policy.task_policies).length}</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function ModelPoliciesPage() {
  return <QueryProvider><ModelPoliciesView /></QueryProvider>;
}
