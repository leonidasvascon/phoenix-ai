"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type ProviderStatus = {
  id: string;
  kind: "image" | "video" | "voice";
  status: "offline" | "online";
  mode: "mock" | "production";
};

const labels: Record<ProviderStatus["kind"], string> = {
  video: "Video",
  image: "Image",
  voice: "Voice"
};

function ProvidersView() {
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: async (): Promise<ProviderStatus[]> => {
      const response = await apiFetch("/providers");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar providers.");
      }

      return response.json();
    }
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Providers</h1>
      </section>

      {providers.isLoading ? <p className="muted">Carregando providers...</p> : null}
      {providers.error ? <p className="error">{providers.error.message}</p> : null}

      <section className="providers-grid">
        {providers.data?.map((provider) => (
          <article className="provider-card" key={provider.kind}>
            <header>
              <div>
                <p>{labels[provider.kind]}</p>
                <h2>{provider.id}</h2>
              </div>
              <span data-status={provider.status}>{provider.status}</span>
            </header>
            <dl>
              <div>
                <dt>Modo</dt>
                <dd>{provider.mode}</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{provider.kind}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function ProvidersPage() {
  return (
    <QueryProvider>
      <ProvidersView />
    </QueryProvider>
  );
}
