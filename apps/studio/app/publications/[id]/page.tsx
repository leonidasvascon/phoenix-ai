"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Navigation } from "../../../components/navigation";
import { PublicationStatus } from "../../../components/publication-status";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Publication = {
  id: string;
  execution_id: string;
  platform: string;
  requested_provider: string;
  effective_provider: string;
  status: string;
  dry_run: boolean;
  allow_fallback_assets: boolean;
  fallback_assets: boolean;
  caption: string;
  hashtags: string[];
  media_path: string;
  thumbnail_path: string;
  metadata_path?: string;
  created_at: string;
  published_at?: string | null;
  external_id?: string | null;
  error?: string | null;
  validation: {
    valid: boolean;
    checks: Array<{ name: string; passed: boolean; message: string }>;
    errors: string[];
  };
};

function PublicationDetailView() {
  const params = useParams<{ id: string }>();
  const publicationId = params.id;
  const queryClient = useQueryClient();
  const publication = useQuery({
    queryKey: ["publication", publicationId],
    queryFn: async (): Promise<Publication> => {
      const response = await apiFetch(`/publications/${publicationId}`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar a publicacao.");
      }

      return response.json();
    }
  });
  const publish = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/publications/${publicationId}/publish`, { method: "POST" });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Nao foi possivel publicar." }));
        throw new Error(error.message ?? "Nao foi possivel publicar.");
      }

      return response.json() as Promise<Publication>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["publication", publicationId] });
      await queryClient.invalidateQueries({ queryKey: ["publications"] });
    }
  });
  const cancel = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/publications/${publicationId}/cancel`, { method: "POST" });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Nao foi possivel cancelar." }));
        throw new Error(error.message ?? "Nao foi possivel cancelar.");
      }

      return response.json() as Promise<Publication>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["publication", publicationId] });
      await queryClient.invalidateQueries({ queryKey: ["publications"] });
    }
  });
  const data = publication.data;

  return (
    <main className="publications-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Publicacao</h1>
      </section>

      {publication.isLoading ? <p className="muted">Carregando publicacao...</p> : null}
      {publication.error ? <p className="error">{publication.error.message}</p> : null}
      {data ? (
        <section className="publication-detail">
          <header>
            <div>
              <p>{data.platform}</p>
              <h2>{data.execution_id}</h2>
            </div>
            <PublicationStatus status={data.status} />
          </header>
          <dl>
            <div>
              <dt>Provider solicitado</dt>
              <dd>{data.requested_provider}</dd>
            </div>
            <div>
              <dt>Provider efetivo</dt>
              <dd>{data.effective_provider}</dd>
            </div>
            <div>
              <dt>Dry-run</dt>
              <dd>{data.dry_run ? "sim" : "nao"}</dd>
            </div>
            <div>
              <dt>Fallback assets</dt>
              <dd>{data.fallback_assets ? "sim" : "nao"}</dd>
            </div>
            <div>
              <dt>External ID</dt>
              <dd>{data.external_id ?? "-"}</dd>
            </div>
            <div>
              <dt>Publicado em</dt>
              <dd>{data.published_at ?? "-"}</dd>
            </div>
          </dl>

          <section>
            <h3>Arquivos utilizados</h3>
            <ul>
              <li>{data.media_path}</li>
              <li>{data.thumbnail_path}</li>
              <li>{data.metadata_path ?? "-"}</li>
            </ul>
          </section>

          <section>
            <h3>Legenda</h3>
            <p>{data.caption}</p>
            <p className="muted">{data.hashtags.map((tag) => `#${tag}`).join(" ")}</p>
          </section>

          <section>
            <h3>Validacoes</h3>
            <ul className="publication-checks">
              {data.validation.checks.map((check) => (
                <li data-passed={check.passed} key={check.name}>
                  <strong>{check.name}</strong>
                  <span>{check.message}</span>
                </li>
              ))}
            </ul>
            {data.error ? <p className="error">{data.error}</p> : null}
          </section>

          <div className="publication-actions">
            <button className="primary-action" type="button" disabled={data.status === "published" || data.status === "cancelled" || publish.isPending} onClick={() => publish.mutate()}>
              {publish.isPending ? "Publicando..." : "Publicar"}
            </button>
            <button className="secondary-action" type="button" disabled={data.status === "published" || data.status === "cancelled" || cancel.isPending} onClick={() => cancel.mutate()}>
              {cancel.isPending ? "Cancelando..." : "Cancelar"}
            </button>
          </div>
          {publish.error ? <p className="error">{publish.error.message}</p> : null}
          {cancel.error ? <p className="error">{cancel.error.message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}

export default function PublicationDetailPage() {
  return (
    <QueryProvider>
      <PublicationDetailView />
    </QueryProvider>
  );
}
