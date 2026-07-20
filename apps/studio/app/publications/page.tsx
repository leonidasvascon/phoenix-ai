"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navigation } from "../../components/navigation";
import { PublicationStatus } from "../../components/publication-status";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type Publication = {
  id: string;
  execution_id: string;
  platform: string;
  status: string;
  dry_run: boolean;
  allow_fallback_assets: boolean;
  fallback_assets: boolean;
  caption: string;
  hashtags: string[];
  created_at: string;
  external_id?: string | null;
};

type ExecutionPackage = {
  files: Record<string, string>;
  execution: {
    execution_id: string;
    execution: {
      task?: {
        platform?: string;
        format?: string;
      };
    };
  };
};

type SocialConnection = {
  id: string;
  provider: "instagram";
  accountUsername?: string;
  accountId: string;
  ready: boolean;
  status: string;
};

function PublicationsView() {
  const searchParams = useSearchParams();
  const executionId = searchParams.get("execution_id") ?? "";
  const queryClient = useQueryClient();
  const publications = useQuery({
    queryKey: ["publications"],
    queryFn: async (): Promise<Publication[]> => {
      const response = await apiFetch("/publications");

      if (!response.ok) {
        throw new Error("Não foi possível carregar publicações.");
      }

      return response.json();
    }
  });
  const executionPackage = useQuery({
    enabled: Boolean(executionId),
    queryKey: ["execution", executionId, "publication"],
    queryFn: async (): Promise<ExecutionPackage> => {
      const response = await apiFetch(`/executions/${executionId}`);

      if (!response.ok) {
        throw new Error("Não foi possível carregar pacote da execução.");
      }

      return response.json();
    }
  });
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [provider, setProvider] = useState("mock");
  const [dryRun, setDryRun] = useState(true);
  const socialConnections = useQuery({
    queryKey: ["social-connections", "publications"],
    queryFn: async (): Promise<SocialConnection[]> => {
      const response = await apiFetch("/social-connections");
      if (!response.ok) return [];
      return response.json();
    }
  });
  const assets = useMemo(() => parseAssets(executionPackage.data?.files["assets/assets.json"]), [executionPackage.data]);
  const readyInstagramConnection = socialConnections.data?.find((connection) => connection.provider === "instagram" && connection.ready);
  const instagramBlocked = provider === "instagram" && !readyInstagramConnection;
  const suggestedCaption = executionPackage.data?.files["legenda.txt"]?.trim() ?? "";
  const suggestedHashtags = executionPackage.data?.files["hashtags.txt"]?.trim() ?? "";
  const createDraft = useMutation({
    mutationFn: async () => {
      const response = await apiFetch("/publications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          execution_id: executionId,
          platform: executionPackage.data?.execution.execution.task?.platform ?? "instagram",
          provider,
          format: executionPackage.data?.execution.execution.task?.format ?? "reel",
          caption: caption || suggestedCaption,
          hashtags: (hashtags || suggestedHashtags).split(/\s+/).map((item) => item.replace(/^#/, "")).filter(Boolean),
          dry_run: dryRun
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Não foi possível criar rascunho." }));
        throw new Error(error.message ?? "Não foi possível criar rascunho.");
      }

      return response.json() as Promise<Publication>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["publications"] });
    }
  });

  return (
    <main className="publications-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Publicações</h1>
      </section>

      {executionId ? (
        <section className="publication-prep">
          <header>
            <div>
              <p>Preparar publicação</p>
              <h2>{executionId}</h2>
            </div>
            {assets?.hasFallback ? <span data-kind="warning">Assets fallback</span> : null}
          </header>
          {executionPackage.isLoading ? <p className="muted">Carregando pacote...</p> : null}
          {executionPackage.error ? <p className="error">{executionPackage.error.message}</p> : null}
          {assets?.hasFallback ? (
            <p className="publication-warning">Este pacote contém assets mock/fallback. A API bloqueia a publicação quando `PHOENIX_ALLOW_FALLBACK_ASSETS=false`.</p>
          ) : null}
          <label>
            Plataforma
            <select value={executionPackage.data?.execution.execution.task?.platform ?? "instagram"} disabled>
              <option value="instagram">instagram</option>
            </select>
          </label>
          <label>
            Provider
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              <option value="mock">mock</option>
              <option value="instagram">instagram</option>
            </select>
          </label>
          <label>
            Legenda editável
            <textarea value={caption || suggestedCaption} onChange={(event) => setCaption(event.target.value)} />
          </label>
          {provider === "instagram" ? (
            <p className={readyInstagramConnection ? "success" : "publication-warning"}>
              {readyInstagramConnection
                ? `Instagram conectado: @${readyInstagramConnection.accountUsername ?? readyInstagramConnection.accountId}`
                : "Nenhum canal Instagram válido foi encontrado. Configure em Canais Sociais antes de publicar."}
            </p>
          ) : null}
          <label>
            Hashtags
            <input value={hashtags || suggestedHashtags} onChange={(event) => setHashtags(event.target.value)} />
          </label>
          <dl>
            <div>
              <dt>Vídeo</dt>
              <dd>{assets?.videoStatus ?? "-"}</dd>
            </div>
            <div>
              <dt>Thumbnail</dt>
              <dd>{assets?.imageStatus ?? "-"}</dd>
            </div>
            <div>
              <dt>Dry-run</dt>
              <dd>{dryRun ? "sim" : "não"}</dd>
            </div>
          </dl>
          <label className="checkbox-label">
            <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
            Somente validar
          </label>
          <button className="primary-action" type="button" disabled={!executionPackage.data || createDraft.isPending || instagramBlocked} onClick={() => createDraft.mutate()}>
            {createDraft.isPending ? "Criando..." : "Criar rascunho"}
          </button>
          {createDraft.error ? <p className="error">{createDraft.error.message}</p> : null}
          {createDraft.data ? <p className="success">Rascunho criado: <Link href={`/publications/${createDraft.data.id}`}>{createDraft.data.id}</Link></p> : null}
        </section>
      ) : null}

      {publications.isLoading ? <p className="muted">Carregando publicações...</p> : null}
      {publications.error ? <p className="error">{publications.error.message}</p> : null}
      {publications.data?.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhuma publicação preparada</h2>
          <p>Abra o preview de uma execução e clique em Preparar publicação.</p>
        </section>
      ) : null}
      <section className="publication-list">
        {publications.data?.map((publication) => (
          <article className="publication-card" key={publication.id}>
            <header>
              <div>
                <p>{publication.platform}</p>
                <h2>{publication.execution_id}</h2>
              </div>
              <PublicationStatus status={publication.status} />
            </header>
            <dl>
              <div>
                <dt>Dry-run</dt>
                <dd>{publication.dry_run ? "sim" : "não"}</dd>
              </div>
              <div>
                <dt>Fallback assets</dt>
                <dd>{publication.fallback_assets ? "sim" : "não"}</dd>
              </div>
              <div>
                <dt>External ID</dt>
                <dd>{publication.external_id ?? "-"}</dd>
              </div>
            </dl>
            <Link href={`/publications/${publication.id}`}>Abrir publicação</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function PublicationsPage() {
  return (
    <QueryProvider>
      <PublicationsView />
    </QueryProvider>
  );
}

function parseAssets(source: string | undefined) {
  if (!source) return null;

  try {
    const assets = JSON.parse(source) as {
      image?: { fallback?: boolean; placeholder?: boolean; provider_id?: string };
      video?: { fallback?: boolean; placeholder?: boolean; provider_id?: string; status?: string };
    };
    const imageFallback = Boolean(assets.image?.fallback || assets.image?.placeholder);
    const videoFallback = Boolean(assets.video?.fallback || assets.video?.placeholder);

    return {
      hasFallback: imageFallback || videoFallback,
      imageStatus: imageFallback ? "mock/placeholder" : assets.image?.provider_id ?? "ok",
      videoStatus: videoFallback ? "mock/placeholder" : assets.video?.status ?? assets.video?.provider_id ?? "ok"
    };
  } catch {
    return null;
  }
}
