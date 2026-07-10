"use client";

import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type ProviderStatus = {
  id: string;
  kind: "image" | "video" | "voice" | "publishing" | "instagram";
  status: "offline" | "online";
  mode: "mock" | "production";
  requested_provider?: string;
  effective_provider?: string;
  fallback?: boolean;
  model?: string | null;
  voice?: string | null;
  size?: string;
  duration_seconds?: number;
  format?: string;
  speed?: number;
  dry_run?: boolean;
  allow_fallback_assets?: boolean;
  configured?: boolean;
  account_id_present?: boolean;
  access_token_present?: boolean;
  graph_api_version_present?: boolean;
  public_media_base_url_present?: boolean;
  ready?: boolean;
};

const labels: Record<ProviderStatus["kind"], string> = {
  video: "Video",
  image: "Image",
  voice: "Voice",
  publishing: "Publishing",
  instagram: "Instagram"
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
            {provider.fallback ? <p className="provider-fallback">Fallback ativo</p> : null}
            <dl>
              <div>
                <dt>Modo</dt>
                <dd>{provider.mode}</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{provider.kind}</dd>
              </div>
              {provider.kind === "voice" || provider.kind === "video" ? (
                <>
                  <div>
                    <dt>Solicitado</dt>
                    <dd>{provider.requested_provider ?? provider.id}</dd>
                  </div>
                  <div>
                    <dt>Efetivo</dt>
                    <dd>{provider.effective_provider ?? provider.id}</dd>
                  </div>
                  <div>
                    <dt>Modelo</dt>
                    <dd>{provider.model ?? "-"}</dd>
                  </div>
                  {provider.kind === "voice" ? (
                    <>
                      <div>
                        <dt>Voz</dt>
                        <dd>{provider.voice ?? "-"}</dd>
                      </div>
                      <div>
                        <dt>Formato</dt>
                        <dd>{provider.format ?? "-"}</dd>
                      </div>
                      <div>
                        <dt>Velocidade</dt>
                        <dd>{provider.speed ?? "-"}</dd>
                      </div>
                    </>
                  ) : null}
                  {provider.kind === "video" ? (
                    <>
                      <div>
                        <dt>Resolucao</dt>
                        <dd>{provider.size ?? "-"}</dd>
                      </div>
                      <div>
                        <dt>Duracao</dt>
                        <dd>{provider.duration_seconds ? `${provider.duration_seconds}s` : "-"}</dd>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
              {provider.kind === "publishing" ? (
                <>
                  <div>
                    <dt>Solicitado</dt>
                    <dd>{provider.requested_provider ?? provider.id}</dd>
                  </div>
                  <div>
                    <dt>Efetivo</dt>
                    <dd>{provider.effective_provider ?? provider.id}</dd>
                  </div>
                  <div>
                    <dt>Dry-run</dt>
                    <dd>{provider.dry_run ? "sim" : "nao"}</dd>
                  </div>
                  <div>
                    <dt>Fallback assets</dt>
                    <dd>{provider.allow_fallback_assets ? "permitido" : "bloqueado"}</dd>
                  </div>
                </>
              ) : null}
              {provider.kind === "instagram" ? (
                <>
                  <div>
                    <dt>Configurado</dt>
                    <dd>{provider.configured ? "sim" : "nao"}</dd>
                  </div>
                  <div>
                    <dt>Conta</dt>
                    <dd>{provider.account_id_present ? "ok" : "ausente"}</dd>
                  </div>
                  <div>
                    <dt>Token</dt>
                    <dd>{provider.access_token_present ? "ok" : "ausente"}</dd>
                  </div>
                  <div>
                    <dt>Graph API</dt>
                    <dd>{provider.graph_api_version_present ? "ok" : "ausente"}</dd>
                  </div>
                  <div>
                    <dt>URL publica</dt>
                    <dd>{provider.public_media_base_url_present ? "ok" : "ausente"}</dd>
                  </div>
                  <div>
                    <dt>Pronto</dt>
                    <dd>{provider.ready ? "sim" : "nao"}</dd>
                  </div>
                </>
              ) : null}
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
