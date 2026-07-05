"use client";

import { useMutation } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Navigation } from "../components/navigation";
import { QueryProvider } from "./query-provider";

type TaskFormat = "reel" | "carousel" | "story";

type StudioResult = {
  status: "success" | "error";
  execution_id: string;
  score: number;
  execution_time: number;
  media_package?: {
    directory: string;
    files: string[];
  };
  output?: {
    hook?: string;
    caption?: string;
    hashtags?: string[];
  };
};

type TaskInput = {
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: TaskFormat;
};

const apiUrl = process.env.NEXT_PUBLIC_PHOENIX_API_URL ?? "http://127.0.0.1:4000";

function PhoenixStudio() {
  const mutation = useMutation({
    mutationFn: async (task: TaskInput): Promise<StudioResult> => {
      const response = await fetch(`${apiUrl}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(task)
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel gerar o conteudo.");
      }

      return response.json();
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    mutation.mutate({
      brand: String(formData.get("brand") ?? "encanto-intenso"),
      theme: String(formData.get("theme") ?? ""),
      objective: String(formData.get("objective") ?? ""),
      platform: "instagram",
      format: String(formData.get("format") ?? "reel") as TaskFormat
    });
  }

  return (
    <main className="studio-shell">
      <Navigation />
      <section className="studio-panel">
        <div className="studio-heading">
          <p>Phoenix AI</p>
          <h1>Phoenix Studio</h1>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <label>
            Marca
            <select name="brand" defaultValue="encanto-intenso">
              <option value="encanto-intenso">Encanto Intenso</option>
            </select>
          </label>

          <label>
            Tema
            <input name="theme" placeholder="Saudade" required />
          </label>

          <label>
            Objetivo
            <input name="objective" placeholder="Viralizar" required />
          </label>

          <fieldset>
            <legend>Formato</legend>
            <label>
              <input type="radio" name="format" value="reel" defaultChecked />
              Reel
            </label>
            <label>
              <input type="radio" name="format" value="carousel" />
              Carrossel
            </label>
            <label>
              <input type="radio" name="format" value="story" />
              Story
            </label>
          </fieldset>

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Gerando..." : "Gerar"}
          </button>
        </form>
      </section>

      <section className="result-panel">
        <h2>Resultado</h2>
        {!mutation.data && !mutation.error ? <p className="muted">Aguardando uma nova task.</p> : null}
        {mutation.error ? <p className="error">{mutation.error.message}</p> : null}
        {mutation.data ? (
          <div className="result-content">
            <dl>
              <div>
                <dt>Status</dt>
                <dd>{mutation.data.status}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd>{mutation.data.score}</dd>
              </div>
              <div>
                <dt>Tempo</dt>
                <dd>{mutation.data.execution_time}s</dd>
              </div>
            </dl>

            <div>
              <h3>Pacote</h3>
              <p>{mutation.data.media_package?.directory}</p>
              <ul>
                {mutation.data.media_package?.files.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Previa</h3>
              <p>{mutation.data.output?.hook}</p>
              <p>{mutation.data.output?.caption}</p>
              <p>{mutation.data.output?.hashtags?.join(" ")}</p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <QueryProvider>
      <PhoenixStudio />
    </QueryProvider>
  );
}
