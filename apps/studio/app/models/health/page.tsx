"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Health = { provider_id: string; available: boolean; configured: boolean; latency_ms: number; error_rate: number; last_checked_at: string; reason?: string };

function ModelHealthView() {
  const health = useQuery({
    queryKey: ["model-health"],
    queryFn: async (): Promise<Health[]> => {
      const response = await apiFetch("/models/health");
      if (!response.ok) throw new Error("Nao foi possivel carregar health de modelos.");
      return response.json();
    }
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Phoenix Studio</p><h1>Model Health</h1></section>
      <section className="providers-grid">
        {health.data?.map((item) => (
          <article className="provider-card" key={item.provider_id}>
            <header>
              <div><p>Provider</p><h2>{item.provider_id}</h2></div>
              <span data-status={item.available ? "online" : "offline"}>{item.available ? "online" : "offline"}</span>
            </header>
            {item.reason ? <p className="provider-fallback">{item.reason}</p> : null}
            <dl>
              <div><dt>Configurado</dt><dd>{item.configured ? "sim" : "nao"}</dd></div>
              <div><dt>Latencia media</dt><dd>{item.latency_ms}ms</dd></div>
              <div><dt>Taxa de erro</dt><dd>{item.error_rate}</dd></div>
              <div><dt>Ultima verificacao</dt><dd>{item.last_checked_at}</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function ModelHealthPage() {
  return <QueryProvider><ModelHealthView /></QueryProvider>;
}
