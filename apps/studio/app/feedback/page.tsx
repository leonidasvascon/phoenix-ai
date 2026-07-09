"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useState } from "react";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type ContentFeedback = {
  execution_id: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
  posted_at: string;
  created_at?: string;
  updated_at?: string;
};

const defaultForm: ContentFeedback = {
  execution_id: "",
  platform: "instagram",
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  followers_gained: 0,
  posted_at: new Date().toISOString().slice(0, 16)
};

function FeedbackView() {
  const searchParams = useSearchParams();
  const executionId = searchParams.get("execution_id") ?? "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContentFeedback>(() => ({
    ...defaultForm,
    execution_id: executionId
  }));
  const feedback = useQuery({
    queryKey: ["feedback"],
    queryFn: async (): Promise<ContentFeedback[]> => {
      const response = await apiFetch("/feedback");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar feedbacks.");
      }

      return response.json();
    }
  });
  const saveFeedback = useMutation({
    mutationFn: async (payload: ContentFeedback): Promise<ContentFeedback> => {
      const response = await apiFetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          posted_at: new Date(payload.posted_at).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar feedback.");
      }

      return response.json();
    },
    onSuccess: (saved) => {
      setForm((current) => ({
        ...current,
        execution_id: saved.execution_id
      }));
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    }
  });

  useEffect(() => {
    if (executionId) {
      setForm((current) => ({
        ...current,
        execution_id: executionId
      }));
    }
  }, [executionId]);

  function updateField<K extends keyof ContentFeedback>(field: K, value: ContentFeedback[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateMetric(field: keyof Pick<ContentFeedback, "comments" | "followers_gained" | "likes" | "saves" | "shares" | "views">, value: string) {
    updateField(field, Math.max(0, Number(value || 0)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveFeedback.mutate(form);
  }

  return (
    <main className="feedback-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Feedback</h1>
      </section>

      {feedback.error ? <p className="error">{feedback.error.message}</p> : null}
      {saveFeedback.error ? <p className="error">{saveFeedback.error.message}</p> : null}
      {saveFeedback.data ? <p className="success">Feedback salvo para a execucao {saveFeedback.data.execution_id}.</p> : null}

      <section className="feedback-layout">
        <form className="feedback-form" onSubmit={handleSubmit}>
          <h2>Lancar feedback manual</h2>
          <label>
            Execution ID
            <input onChange={(event) => updateField("execution_id", event.target.value)} required value={form.execution_id} />
          </label>
          <label>
            Plataforma
            <input onChange={(event) => updateField("platform", event.target.value)} required value={form.platform} />
          </label>
          <label>
            Publicado em
            <input onChange={(event) => updateField("posted_at", event.target.value)} required type="datetime-local" value={form.posted_at} />
          </label>
          <div className="feedback-metrics-grid">
            <MetricInput label="Views" onChange={(value) => updateMetric("views", value)} value={form.views} />
            <MetricInput label="Likes" onChange={(value) => updateMetric("likes", value)} value={form.likes} />
            <MetricInput label="Comentarios" onChange={(value) => updateMetric("comments", value)} value={form.comments} />
            <MetricInput label="Shares" onChange={(value) => updateMetric("shares", value)} value={form.shares} />
            <MetricInput label="Saves" onChange={(value) => updateMetric("saves", value)} value={form.saves} />
            <MetricInput label="Seguidores" onChange={(value) => updateMetric("followers_gained", value)} value={form.followers_gained} />
          </div>
          <button className="primary-action" disabled={saveFeedback.isPending} type="submit">
            {saveFeedback.isPending ? "Salvando..." : "Salvar feedback"}
          </button>
        </form>

        <section className="feedback-list">
          {feedback.isLoading ? <p className="muted">Carregando feedbacks...</p> : null}
          {feedback.data?.length === 0 ? (
            <section className="empty-state">
              <h2>Nenhum feedback cadastrado</h2>
              <p>Lance resultados reais para conectar a Phoenix AI com a performance publicada.</p>
            </section>
          ) : null}
          {feedback.data?.map((item) => (
            <article className="feedback-card" key={item.execution_id}>
              <header>
                <div>
                  <p>{item.platform}</p>
                  <h2>{item.execution_id}</h2>
                </div>
                <span>{new Date(item.posted_at).toLocaleDateString("pt-BR")}</span>
              </header>
              <dl>
                <Metric label="Views" value={item.views} />
                <Metric label="Likes" value={item.likes} />
                <Metric label="Comentarios" value={item.comments} />
                <Metric label="Shares" value={item.shares} />
                <Metric label="Saves" value={item.saves} />
                <Metric label="Seguidores" value={item.followers_gained} />
              </dl>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function MetricInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: number }) {
  return (
    <label>
      {label}
      <input min="0" onChange={(event) => onChange(event.target.value)} type="number" value={value} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <QueryProvider>
      <Suspense fallback={<main className="session-loading">Carregando feedback...</main>}>
        <FeedbackView />
      </Suspense>
    </QueryProvider>
  );
}
