"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type ScheduledJobType = "batch" | "task";
type ScheduledJobStatus = "pending" | "running" | "completed" | "failed";

type ScheduledJob = {
  id: string;
  name: string;
  type: ScheduledJobType;
  run_at: string;
  payload: Record<string, unknown>;
  status: ScheduledJobStatus;
  created_at: string;
  updated_at: string;
  executed_at?: string;
  last_error?: string;
};

type SchedulerForm = {
  name: string;
  type: ScheduledJobType;
  run_at: string;
  payload: string;
};

const defaultPayload = JSON.stringify(
  {
    items: [
      {
        brand: "encanto-intenso",
        theme: "saudade",
        objective: "viralizar",
        platform: "instagram",
        format: "reel"
      }
    ]
  },
  null,
  2
);

function toDateTimeLocal(value: Date): string {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function SchedulerView() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SchedulerForm>({
    name: "Semana Saudade",
    type: "batch",
    run_at: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    payload: defaultPayload
  });

  const jobs = useQuery({
    queryKey: ["scheduled-jobs"],
    queryFn: async (): Promise<ScheduledJob[]> => {
      const response = await apiFetch("/scheduled-jobs");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar jobs agendados.");
      }

      return response.json();
    }
  });

  const createJob = useMutation({
    mutationFn: async (payload: SchedulerForm): Promise<ScheduledJob> => {
      const response = await apiFetch("/scheduled-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: payload.name,
          type: payload.type,
          run_at: new Date(payload.run_at).toISOString(),
          payload: JSON.parse(payload.payload),
          status: "pending"
        })
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel criar o agendamento.");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-jobs"] });
    }
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const response = await apiFetch(`/scheduled-jobs/${jobId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir o agendamento.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-jobs"] });
    }
  });

  const runDueJobs = useMutation({
    mutationFn: async (): Promise<{ executed: number; jobs: ScheduledJob[] }> => {
      const response = await apiFetch("/scheduled-jobs/run-due", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel executar jobs vencidos.");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-jobs"] });
    }
  });

  function updateField<K extends keyof SchedulerForm>(field: K, value: SchedulerForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createJob.mutate(form);
  }

  return (
    <main className="scheduler-shell">
      <Navigation />

      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Studio</p>
          <h1>Scheduler</h1>
        </div>
        <button className="secondary-action" disabled={runDueJobs.isPending} onClick={() => runDueJobs.mutate()} type="button">
          {runDueJobs.isPending ? "Executando..." : "Executar vencidos"}
        </button>
      </section>

      {jobs.error ? <p className="error">{jobs.error.message}</p> : null}
      {createJob.error ? <p className="error">{createJob.error.message}</p> : null}
      {deleteJob.error ? <p className="error">{deleteJob.error.message}</p> : null}
      {runDueJobs.error ? <p className="error">{runDueJobs.error.message}</p> : null}
      {runDueJobs.data ? <p className="success">{runDueJobs.data.executed} job(s) vencido(s) executado(s).</p> : null}

      <section className="scheduler-layout">
        <form className="scheduler-form" onSubmit={handleSubmit}>
          <h2>Novo agendamento</h2>
          <label>
            Nome
            <input onChange={(event) => updateField("name", event.target.value)} required value={form.name} />
          </label>
          <label>
            Tipo
            <select value={form.type} onChange={(event) => updateField("type", event.target.value as ScheduledJobType)}>
              <option value="batch">batch</option>
              <option value="task">task</option>
            </select>
          </label>
          <label>
            Rodar em
            <input onChange={(event) => updateField("run_at", event.target.value)} required type="datetime-local" value={form.run_at} />
          </label>
          <label>
            Payload JSON
            <textarea onChange={(event) => updateField("payload", event.target.value)} required value={form.payload} />
          </label>
          <button className="primary-action" disabled={createJob.isPending} type="submit">
            {createJob.isPending ? "Agendando..." : "Criar job"}
          </button>
        </form>

        <section className="scheduled-job-list">
          {jobs.isLoading ? <p className="muted">Carregando jobs...</p> : null}
          {jobs.data?.length === 0 ? (
            <section className="empty-state">
              <h2>Nenhum job agendado</h2>
              <p>Crie jobs para executar tasks e batches em horarios futuros.</p>
            </section>
          ) : null}

          {jobs.data?.map((job) => (
            <article className="scheduled-job-card" key={job.id}>
              <header>
                <div>
                  <p>{job.type}</p>
                  <h2>{job.name}</h2>
                </div>
                <span data-status={job.status}>{job.status}</span>
              </header>
              <dl>
                <div>
                  <dt>Rodar em</dt>
                  <dd>{job.run_at}</dd>
                </div>
                <div>
                  <dt>Executado em</dt>
                  <dd>{job.executed_at ?? "-"}</dd>
                </div>
                <div>
                  <dt>Erro</dt>
                  <dd>{job.last_error ?? "-"}</dd>
                </div>
              </dl>
              <pre>{JSON.stringify(job.payload, null, 2)}</pre>
              <button
                className="danger-action"
                disabled={deleteJob.isPending}
                onClick={() => {
                  if (window.confirm(`Excluir o job ${job.name}?`)) {
                    deleteJob.mutate(job.id);
                  }
                }}
                type="button"
              >
                Excluir
              </button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default function SchedulerPage() {
  return (
    <QueryProvider>
      <SchedulerView />
    </QueryProvider>
  );
}
