"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type TaskFormat = "reel" | "carousel" | "story";

type TaskTemplateInput = {
  name: string;
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: TaskFormat;
};

type TaskTemplate = TaskTemplateInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

const emptyTemplate: TaskTemplateInput = {
  name: "",
  brand: "encanto-intenso",
  theme: "",
  objective: "",
  platform: "instagram",
  format: "reel"
};

function TemplatesView() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<TaskTemplateInput>(emptyTemplate);

  const templates = useQuery({
    queryKey: ["task-templates"],
    queryFn: async (): Promise<TaskTemplate[]> => {
      const response = await apiFetch("/task-templates");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar templates.");
      }

      return response.json();
    }
  });

  const saveTemplate = useMutation({
    mutationFn: async (payload: TaskTemplateInput): Promise<TaskTemplate> => {
      const endpoint = editingId ? `/task-templates/${editingId}` : "/task-templates";
      const response = await apiFetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o template.");
      }

      return response.json();
    },
    onSuccess: () => {
      setEditingId("");
      setForm(emptyTemplate);
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string): Promise<void> => {
      const response = await apiFetch(`/task-templates/${templateId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir o template.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
    }
  });

  useEffect(() => {
    if (!editingId || !templates.data) {
      return;
    }

    const template = templates.data.find((item) => item.id === editingId);

    if (template) {
      setForm({
        name: template.name,
        brand: template.brand,
        theme: template.theme,
        objective: template.objective,
        platform: template.platform,
        format: template.format
      });
    }
  }, [editingId, templates.data]);

  function updateField<K extends keyof TaskTemplateInput>(field: K, value: TaskTemplateInput[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveTemplate.mutate(form);
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyTemplate);
  }

  return (
    <main className="templates-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Templates</h1>
        </div>
        <button type="button" onClick={resetForm}>
          Novo Template
        </button>
      </section>

      {templates.isLoading ? <p className="muted">Carregando templates...</p> : null}
      {templates.error ? <p className="error">{templates.error.message}</p> : null}
      {saveTemplate.error ? <p className="error">{saveTemplate.error.message}</p> : null}
      {deleteTemplate.error ? <p className="error">{deleteTemplate.error.message}</p> : null}

      <section className="templates-layout">
        <form className="template-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Editar template" : "Novo template"}</h2>
          <label>
            Nome
            <input
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Reel Saudade"
              required
              value={form.name}
            />
          </label>
          <label>
            Marca
            <input
              onChange={(event) => updateField("brand", event.target.value)}
              placeholder="encanto-intenso"
              required
              value={form.brand}
            />
          </label>
          <label>
            Tema
            <input
              onChange={(event) => updateField("theme", event.target.value)}
              placeholder="saudade"
              required
              value={form.theme}
            />
          </label>
          <label>
            Objetivo
            <input
              onChange={(event) => updateField("objective", event.target.value)}
              placeholder="viralizar"
              required
              value={form.objective}
            />
          </label>
          <label>
            Plataforma
            <input
              onChange={(event) => updateField("platform", event.target.value)}
              placeholder="instagram"
              required
              value={form.platform}
            />
          </label>
          <label>
            Formato
            <select value={form.format} onChange={(event) => updateField("format", event.target.value as TaskFormat)}>
              <option value="reel">reel</option>
              <option value="carousel">carousel</option>
              <option value="story">story</option>
            </select>
          </label>
          <div className="template-form-actions">
            <button type="submit" disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? "Salvando..." : editingId ? "Salvar alteracoes" : "Criar template"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <section className="template-list">
          {templates.data?.length === 0 ? (
            <section className="empty-state">
              <h2>Nenhum template criado</h2>
              <p>Salve o primeiro modelo para acelerar tarefas repetidas.</p>
            </section>
          ) : null}

          {templates.data?.map((template) => (
            <article className="template-card" key={template.id}>
              <header>
                <div>
                  <p>{template.brand}</p>
                  <h2>{template.name}</h2>
                </div>
                <span>{template.format}</span>
              </header>
              <dl>
                <div>
                  <dt>Tema</dt>
                  <dd>{template.theme}</dd>
                </div>
                <div>
                  <dt>Objetivo</dt>
                  <dd>{template.objective}</dd>
                </div>
                <div>
                  <dt>Plataforma</dt>
                  <dd>{template.platform}</dd>
                </div>
              </dl>
              <div className="template-card-actions">
                <Link href={`/?template=${template.id}`}>Usar template</Link>
                <button type="button" onClick={() => setEditingId(template.id)}>
                  Editar
                </button>
                <button
                  className="danger-action"
                  disabled={deleteTemplate.isPending}
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Excluir o template ${template.name}?`)) {
                      deleteTemplate.mutate(template.id);
                    }
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default function TemplatesPage() {
  return (
    <QueryProvider>
      <TemplatesView />
    </QueryProvider>
  );
}
