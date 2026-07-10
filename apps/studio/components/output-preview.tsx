"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../app/api-client";
import type { ExecutionCardData } from "./execution-card";

export type OutputPackage = {
  execution: ExecutionCardData;
  files: Record<string, string>;
};

const visibleFiles = [
  "roteiro.md",
  "legenda.txt",
  "hashtags.txt",
  "video_prompt.txt",
  "thumbnail_prompt.txt",
  "metadata.json",
  "assets/assets.json"
];

function formatTitle(file: string): string {
  return file.replace(/_/g, " ");
}

export function OutputPreview({ outputPackage }: Readonly<{ outputPackage: OutputPackage }>) {
  const execution = outputPackage.execution;
  const video = parseVideoAsset(outputPackage.files["assets/assets.json"]);

  return (
    <section className="output-preview">
      <header>
        <div>
          <p>Pacote gerado</p>
          <h2>{execution.execution.task?.theme ?? execution.execution_id}</h2>
        </div>
        <div className="output-preview-actions">
          <Link href={`/publications?execution_id=${execution.execution_id}`}>Preparar publicacao</Link>
          <Link href={`/feedback?execution_id=${execution.execution_id}`}>Adicionar feedback</Link>
          <span data-status={execution.status}>{execution.status}</span>
        </div>
      </header>

      <dl className="output-summary">
        <div>
          <dt>Marca</dt>
          <dd>{execution.execution.task?.brand ?? "-"}</dd>
        </div>
        <div>
          <dt>Formato</dt>
          <dd>{execution.execution.task?.format ?? "-"}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{execution.score}</dd>
        </div>
        <div>
          <dt>Pacote</dt>
          <dd>{execution.media_package?.directory ?? "-"}</dd>
        </div>
      </dl>

      <section className="video-preview-panel">
        <div>
          <p>Video</p>
          <h3>{formatVideoStatus(video)}</h3>
        </div>
        {video ? (
          <dl>
            <div>
              <dt>Provider</dt>
              <dd>{video.provider_id}</dd>
            </div>
            <div>
              <dt>Fallback</dt>
              <dd>{video.fallback ? "sim" : "nao"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{video.status ?? "-"}</dd>
            </div>
          </dl>
        ) : null}
        {video?.status === "completed" && !video.fallback ? <VideoPlayer executionId={execution.execution_id} /> : null}
      </section>

      <div className="output-files">
        {visibleFiles.map((file) => (
          <article className="output-file" key={file}>
            <h3>{formatTitle(file)}</h3>
            <pre>{outputPackage.files[file] || "Arquivo vazio ou nao encontrado."}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

function parseVideoAsset(source: string | undefined): null | {
  fallback?: boolean;
  provider_id?: string;
  status?: string;
} {
  if (!source) return null;

  try {
    const parsed = JSON.parse(source) as { video?: { fallback?: boolean; provider_id?: string; status?: string } };
    return parsed.video ?? null;
  } catch {
    return null;
  }
}

function formatVideoStatus(video: ReturnType<typeof parseVideoAsset>): string {
  if (!video) return "nao encontrado";
  if (video.fallback) return "fallback";
  if (video.status === "completed") return "concluido";
  if (video.status === "failed") return "falhou";
  if (video.status === "processing" || video.status === "queued") return "processando";
  return video.status ?? "desconhecido";
}

function VideoPlayer({ executionId }: { executionId: string }) {
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    let mounted = true;

    apiFetch(`/executions/${executionId}/assets/video`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Nao foi possivel carregar o video.");
        }

        objectUrl = URL.createObjectURL(await response.blob());
        if (mounted) setSource(objectUrl);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Erro ao carregar video.");
      });

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [executionId]);

  const label = useMemo(() => (source ? "Video gerado" : "Carregando video..."), [source]);

  if (error) return <p className="error">{error}</p>;
  if (!source) return <p className="muted">{label}</p>;

  return <video className="video-preview-player" src={source} controls />;
}
