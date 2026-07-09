"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Navigation } from "../../../components/navigation";
import { apiFetch } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type TaskFormat = "reel" | "carousel" | "story";

type BatchTemplateItem = {
  brand: string;
  theme: string;
  objective: string;
  platform: string;
  format: TaskFormat;
};

type BatchTemplateInput = {
  name: string;
  items: BatchTemplateItem[];
};

type BatchTemplate = BatchTemplateInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

const emptyTemplate: BatchTemplateInput = {
  name: "",
  items: [
    {
      brand: "encanto-intenso",
      theme: "saudade",
      objective: "viralizar",
      platform: "instagram",
      format: "reel"
    }
  ]
};

function cloneTemplate(input: BatchTemplateInput): BatchTemplateInput {
  return {
    name: input.name,
    items: input.items.map((item) => ({ ...item }))
  };
}

function BatchTemplatesView() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<BatchTemplateInput>(() => cloneTemplate(emptyTemplate));

  const templates = useQuery({
    queryKey: ["batch-templates"],
    queryFn: async (): Promise<BatchTemplate[]> => {
      const response = await apiFetch("/batch-templates");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar templates de lote.");
      }

      return response.json();
    }
  });

  const saveTemplate = useMutation({
    mutationFn: async (payload: BatchTemplateInput): Promise<BatchTemplate> => {
      const endpoint = editingId ? `/batch-templates/${editingId}` : "/batch-templates";
      const response = await apiFetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o template de lote.");
      }

      return response.json();
    },
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["batch-templates"] });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string): Promise<void> => {
      const response = await apiFetch(`/batch-templates/${templateId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir o template de lote.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-templates"] });
    }
  });

  useEffect(() => {
    if (!editingId || !templates.data) {
      return;
    }

    const template = templates.data.find((item) => item.id === editingId);

    if (template) {
      setForm(cloneTemplate(template));
    }
  }, [editingId, templates.data]);

  function updateTemplateName(name: string) {
    setForm((current) => ({
      ...current,
      name
    }));
  }

  function updateItem<K extends keyof BatchTemplateItem>(index: number, field: K, value: BatchTemplateItem[K]) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          brand: "encanto-intenso",
          theme: "",
          objective: "",
          platform: "instagram",
          format: "reel"
        }
      ]
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.length > 1 ? current.items.filter((_item, itemIndex) => itemIndex !== index) : current.items
    }));
  }

  function resetForm() {
    setEditingId("");
    setForm(cloneTemplate(emptyTemplate));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveTemplate.mutate(form);
  }

  return (
    <main className="batch-shell">
      <Navigation />

      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Templates de lote</h1>
        </div>
        <div className="heading-actions">
          <Link href="/batch">Voltar ao Batch</Link>
          <button className="secondary-action" onClick={resetForm} type="button">
            Novo template
          </button>
        </div>
      </section>

      {templates.isLoading ? <p className="muted">Carregando templates de lote...</p> : null}
      {templates.error ? <p className="error">{templates.error.message}</p> : null}
      {saveTemplate.error ? <p className="error">{saveTemplate.error.message}</p> : null}
      {deleteTemplate.error ? <p className="error">{deleteTemplate.error.message}</p> : null}

      <section className="batch-templates-layout">
        <form className="batch-template-editor" onSubmit={handleSubmit}>
          <h2>{editingId ? "Editar template de lote" : "Novo template de lote"}</h2>
          <label>
            Nome
            <input
              onChange={(event) => updateTemplateName(event.target.value)}
              placeholder="Semana Saudade"
              required
              value={form.name}
            />
          </label>

          <div className="batch-template-items">
            {form.items.map((item, index) => (
              <article className="batch-template-item" key={index}>
                <h3>Task {index + 1}</h3>
                <label>
                  Marca
                  <input onChange={(event) => updateItem(index, "brand", event.target.value)} required value={item.brand} />
                </label>
                <label>
                  Tema
                  <input onChange={(event) => updateItem(index, "theme", event.target.value)} required value={item.theme} />
                </label>
                <label>
                  Objetivo
                  <input onChange={(event) => updateItem(index, "objective", event.target.value)} required value={item.objective} />
                </label>
                <label>
                  Plataforma
                  <input onChange={(event) => updateItem(index, "platform", event.target.value)} required value={item.platform} />
                </label>
                <label>
                  Formato
                  <select value={item.format} onChange={(event) => updateItem(index, "format", event.target.value as TaskFormat)}>
                    <option value="reel">reel</option>
                    <option value="carousel">carousel</option>
                    <option value="story">story</option>
                  </select>
                </label>
                <button disabled={form.items.length === 1} onClick={() => removeItem(index)} type="button">
                  Remover task
                </button>
              </article>
            ))}
          </div>

          <div className="template-form-actions">
            <button className="secondary-action" onClick={addItem} type="button">
              Adicionar task
            </button>
            <button className="primary-action" disabled={saveTemplate.isPending} type="submit">
              {saveTemplate.isPending ? "Salvando..." : editingId ? "Salvar alteracoes" : "Criar template"}
            </button>
          </div>
        </form>

        <section className="template-list">
          {templates.data?.length === 0 ? (
            <section className="empty-state">
              <h2>Nenhum template de lote</h2>
              <p>Salve lotes recorrentes para acelerar operacoes semanais.</p>
            </section>
          ) : null}

          {templates.data?.map((template) => (
            <article className="template-card" key={template.id}>
              <header>
                <div>
                  <p>{template.items.length} tasks</p>
                  <h2>{template.name}</h2>
                </div>
                <span>batch</span>
              </header>
              <dl>
                {template.items.slice(0, 3).map((item, index) => (
                  <div key={`${template.id}-${index}`}>
                    <dt>{item.theme}</dt>
                    <dd>{item.objective}</dd>
                  </div>
                ))}
              </dl>
              <div className="template-card-actions">
                <Link href="/batch">Usar no Batch</Link>
                <button type="button" onClick={() => setEditingId(template.id)}>
                  Editar
                </button>
                <button
                  className="danger-action"
                  disabled={deleteTemplate.isPending}
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Excluir o template de lote ${template.name}?`)) {
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

export default function BatchTemplatesPage() {
  return (
    <QueryProvider>
      <BatchTemplatesView />
    </QueryProvider>
  );
}
