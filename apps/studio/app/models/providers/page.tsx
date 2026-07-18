"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

function ModelProvidersView() {
  const providers = useQuery({
    queryKey: ["model-providers"],
    queryFn: async (): Promise<Array<{ id: string; capabilities: Record<string, unknown> }>> => {
      const response = await apiFetch("/models/providers");
      if (!response.ok) throw new Error("Nao foi possivel carregar providers de modelo.");
      return response.json();
    }
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading"><p>Phoenix Studio</p><h1>Model Providers</h1></section>
      <section className="providers-grid">
        {providers.data?.map((provider) => (
          <article className="provider-card" key={provider.id}>
            <header><div><p>Provider</p><h2>{provider.id}</h2></div></header>
            <dl>
              {Object.entries(provider.capabilities).map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
              ))}
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function ModelProvidersPage() {
  return <QueryProvider><ModelProvidersView /></QueryProvider>;
}
