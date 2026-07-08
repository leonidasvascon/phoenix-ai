"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useState } from "react";
import { Navigation } from "../components/navigation";
import { QueryProvider } from "./query-provider";
import { apiFetch } from "./api-client";

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

type TaskTemplate = TaskInput & {
  id: string;
  name: string;
};

const defaultTask: TaskInput = {
  brand: "encanto-intenso",
  theme: "",
  objective: "",
  platform: "instagram",
  format: "reel"
};

function PhoenixStudio() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const [task, setTask] = useState<TaskInput>(defaultTask);
  const templates = useQuery({
    enabled: Boolean(templateId),
    queryKey: ["task-templates"],
    queryFn: async (): Promise<TaskTemplate[]> => {
      const response = await apiFetch("/task-templates");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar templates.");
      }

      return response.json();
    }
  });
  const selectedTemplate = templates.data?.find((item) => item.id === templateId);
  const mutation = useMutation({
    mutationFn: async (task: TaskInput): Promise<StudioResult> => {
      const response = await apiFetch("/tasks", {
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

  useEffect(() => {
    if (!templateId || !templates.data) {
      return;
    }

    if (selectedTemplate) {
      setTask({
        brand: selectedTemplate.brand,
        theme: selectedTemplate.theme,
        objective: selectedTemplate.objective,
        platform: selectedTemplate.platform,
        format: selectedTemplate.format
      });
    }
  }, [selectedTemplate, templateId]);

  function updateTask<K extends keyof TaskInput>(field: K, value: TaskInput[K]) {
    setTask((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(task);
  }

  return (
    <main className="studio-shell">
      <Navigation />
      <section className="studio-panel">
        <div className="studio-heading">
          <p>Phoenix AI</p>
          <h1>Phoenix Studio</h1>
        </div>
        {selectedTemplate ? <p className="success">Template carregado na task.</p> : null}
        {templates.error ? <p className="error">{templates.error.message}</p> : null}

        <form className="task-form" onSubmit={handleSubmit}>
          <label>
            Marca
            <select name="brand" value={task.brand} onChange={(event) => updateTask("brand", event.target.value)}>
              {task.brand !== "encanto-intenso" ? <option value={task.brand}>{task.brand}</option> : null}
              <option value="encanto-intenso">Encanto Intenso</option>
            </select>
          </label>

          <label>
            Tema
            <input
              name="theme"
              onChange={(event) => updateTask("theme", event.target.value)}
              placeholder="Saudade"
              required
              value={task.theme}
            />
          </label>

          <label>
            Objetivo
            <input
              name="objective"
              onChange={(event) => updateTask("objective", event.target.value)}
              placeholder="Viralizar"
              required
              value={task.objective}
            />
          </label>

          <fieldset>
            <legend>Formato</legend>
            <label>
              <input
                checked={task.format === "reel"}
                name="format"
                onChange={() => updateTask("format", "reel")}
                type="radio"
                value="reel"
              />
              Reel
            </label>
            <label>
              <input
                checked={task.format === "carousel"}
                name="format"
                onChange={() => updateTask("format", "carousel")}
                type="radio"
                value="carousel"
              />
              Carrossel
            </label>
            <label>
              <input
                checked={task.format === "story"}
                name="format"
                onChange={() => updateTask("format", "story")}
                type="radio"
                value="story"
              />
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
      <Suspense fallback={<main className="session-loading">Carregando Studio...</main>}>
        <PhoenixStudio />
      </Suspense>
    </QueryProvider>
  );
}
