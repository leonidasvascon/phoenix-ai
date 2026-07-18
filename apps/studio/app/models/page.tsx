"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type ModelResponse = {
  models: Array<{ id: string; provider_id: string; name: string; quality_score: number; latency_score: number; cost_per_1k_input: number; cost_per_1k_output: number; capabilities: Record<string, unknown> }>;
  active_policy: { default_policy: string; fallback_order: string[] };
};

function ModelsView() {
  const models = useQuery({
    queryKey: ["models"],
    queryFn: async (): Promise<ModelResponse> => {
      const response = await apiFetch("/models");
      if (!response.ok) throw new Error("Nao foi possivel carregar modelos.");
      return response.json();
    }
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Model Orchestration</h1>
        <div className="button-row">
          <Link className="secondary-button" href="/models/providers">Providers</Link>
          <Link className="secondary-button" href="/models/policies">Policies</Link>
          <Link className="secondary-button" href="/models/health">Health</Link>
        </div>
      </section>
      {models.error ? <p className="error">{models.error.message}</p> : null}
      <section className="providers-grid">
        <article className="provider-card">
          <header><div><p>Politica ativa</p><h2>{models.data?.active_policy.default_policy ?? "-"}</h2></div></header>
          <p className="muted">Fallback: {models.data?.active_policy.fallback_order.join(" -> ") ?? "-"}</p>
        </article>
        {models.data?.models.map((model) => (
          <article className="provider-card" key={model.id}>
            <header>
              <div>
                <p>{model.provider_id}</p>
                <h2>{model.name}</h2>
              </div>
              <span data-status="online">{model.quality_score}</span>
            </header>
            <dl>
              <div><dt>Qualidade</dt><dd>{model.quality_score}</dd></div>
              <div><dt>Latencia</dt><dd>{model.latency_score}</dd></div>
              <div><dt>Custo input</dt><dd>${model.cost_per_1k_input}/1k</dd></div>
              <div><dt>Custo output</dt><dd>${model.cost_per_1k_output}/1k</dd></div>
              <div><dt>JSON</dt><dd>{model.capabilities.structured_json ? "sim" : "nao"}</dd></div>
              <div><dt>Embeddings</dt><dd>{model.capabilities.embeddings ? "sim" : "nao"}</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function ModelsPage() {
  return <QueryProvider><ModelsView /></QueryProvider>;
}
