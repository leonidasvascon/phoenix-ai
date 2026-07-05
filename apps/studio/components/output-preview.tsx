"use client";

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
  "metadata.json"
];

function formatTitle(file: string): string {
  return file.replace(/_/g, " ");
}

export function OutputPreview({ outputPackage }: Readonly<{ outputPackage: OutputPackage }>) {
  const execution = outputPackage.execution;

  return (
    <section className="output-preview">
      <header>
        <div>
          <p>Pacote gerado</p>
          <h2>{execution.execution.task?.theme ?? execution.execution_id}</h2>
        </div>
        <span data-status={execution.status}>{execution.status}</span>
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
