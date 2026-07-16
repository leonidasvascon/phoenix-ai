"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MetricCard } from "../../components/metric-card";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type StrategyGoal = "grow_instagram" | "increase_engagement" | "increase_saves" | "test_new_themes";

type StrategyPlan = {
  id: string;
  generated_at: string;
  summary: {
    goal: StrategyGoal;
    period_days: number;
    total_posts: number;
    primary_brand: string;
    primary_platform: string;
  };
  priorities: Array<{ priority: "high" | "low" | "medium"; message: string }>;
  opportunities: Array<{ type: string; priority: "high" | "low" | "medium"; message: string }>;
  gaps: Array<{ type: string; message: string; suggestion: string }>;
  calendar: Array<{
    day: number;
    theme: string;
    format: "carousel" | "reel" | "story";
    platform: string;
    brand: string;
    objective: string;
    reason: string;
    task: {
      brand: string;
      theme: string;
      objective: string;
      platform: string;
      format: "carousel" | "reel" | "story";
    };
  }>;
};

type EmptyStrategy = {
  status: "empty";
  message: string;
};

const goalLabels: Record<StrategyGoal, string> = {
  grow_instagram: "Crescer no Instagram",
  increase_engagement: "Aumentar engajamento",
  increase_saves: "Aumentar salvamentos",
  test_new_themes: "Testar novos temas"
};

function StrategyView() {
  const queryClient = useQueryClient();
  const [goal, setGoal] = useState<StrategyGoal>("grow_instagram");
  const [periodDays, setPeriodDays] = useState(30);
  const [postsPerWeek, setPostsPerWeek] = useState(7);
  const [brand, setBrand] = useState("encanto-intenso");
  const strategy = useQuery({
    queryKey: ["strategy"],
    queryFn: async (): Promise<StrategyPlan | EmptyStrategy> => {
      const response = await apiFetch("/strategy");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar estrategia.");
      }

      return response.json();
    }
  });
  const generate = useMutation({
    mutationFn: async (): Promise<StrategyPlan> => {
      const response = await apiFetch("/strategy/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          goal,
          period_days: periodDays,
          posts_per_week: postsPerWeek,
          brand,
          platform: "instagram"
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Nao foi possivel gerar estrategia." }));
        throw new Error(error.message ?? "Nao foi possivel gerar estrategia.");
      }

      return response.json();
    },
    onSuccess: (plan) => {
      queryClient.setQueryData(["strategy"], plan);
    }
  });
  const plan = isStrategyPlan(generate.data) ? generate.data : isStrategyPlan(strategy.data) ? strategy.data : null;

  return (
    <main className="strategy-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Strategy Engine</h1>
      </section>

      <section className="strategy-layout">
        <form
          className="strategy-form"
          onSubmit={(event) => {
            event.preventDefault();
            generate.mutate();
          }}
        >
          <h2>Gerar plano</h2>
          <label>
            Objetivo
            <select value={goal} onChange={(event) => setGoal(event.target.value as StrategyGoal)}>
              {Object.entries(goalLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dias
            <input min={7} max={120} type="number" value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))} />
          </label>
          <label>
            Posts por semana
            <input min={1} max={21} type="number" value={postsPerWeek} onChange={(event) => setPostsPerWeek(Number(event.target.value))} />
          </label>
          <label>
            Marca
            <input value={brand} onChange={(event) => setBrand(event.target.value)} />
          </label>
          <button className="primary-action" disabled={generate.isPending} type="submit">
            {generate.isPending ? "Gerando..." : "Gerar plano"}
          </button>
          {generate.error ? <p className="error">{generate.error.message}</p> : null}
          {strategy.error ? <p className="error">{strategy.error.message}</p> : null}
        </form>

        <section className="strategy-result">
          {strategy.isLoading ? <p className="muted">Carregando estrategia...</p> : null}
          {!plan && !strategy.isLoading ? (
            <section className="empty-state">
              <h2>Nenhum plano gerado</h2>
              <p>Escolha objetivo, periodo e frequencia para a Phoenix montar o primeiro calendario estrategico.</p>
            </section>
          ) : null}
          {plan ? <StrategyPlanView plan={plan} /> : null}
        </section>
      </section>
    </main>
  );
}

function StrategyPlanView({ plan }: { plan: StrategyPlan }) {
  return (
    <div className="strategy-plan">
      <section className="metric-grid">
        <MetricCard label="Dias" value={plan.summary.period_days} />
        <MetricCard label="Conteudos" value={plan.summary.total_posts} />
        <MetricCard label="Marca" value={plan.summary.primary_brand} />
        <MetricCard label="Plataforma" value={plan.summary.primary_platform} />
        <MetricCard label="Gerado em" value={new Date(plan.generated_at).toLocaleDateString("pt-BR")} />
      </section>

      <section className="strategy-insights">
        <StrategyList title="Prioridades" items={plan.priorities.map((item) => item.message)} />
        <StrategyList title="Oportunidades" items={plan.opportunities.map((item) => item.message)} />
        <StrategyList title="Gaps" items={plan.gaps.map((item) => `${item.message} ${item.suggestion}`)} />
      </section>

      <section className="strategy-calendar">
        <h2>Calendario editorial</h2>
        <div className="strategy-calendar-list">
          {plan.calendar.map((item) => (
            <article className="strategy-calendar-card" key={`${item.day}-${item.theme}-${item.format}`}>
              <header>
                <div>
                  <p>Dia {item.day}</p>
                  <h3>{item.theme}</h3>
                </div>
                <span>{item.format}</span>
              </header>
              <p>{item.reason}</p>
              <dl>
                <div>
                  <dt>Objetivo</dt>
                  <dd>{item.objective}</dd>
                </div>
                <div>
                  <dt>Marca</dt>
                  <dd>{item.brand}</dd>
                </div>
                <div>
                  <dt>Task</dt>
                  <dd>
                    {item.task.brand} | {item.task.theme} | {item.task.format}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StrategyList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="strategy-panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Sem sinais suficientes ainda.</p>
      )}
    </article>
  );
}

function isStrategyPlan(value: unknown): value is StrategyPlan {
  return Boolean(value && typeof value === "object" && "calendar" in value);
}

export default function StrategyPage() {
  return (
    <QueryProvider>
      <StrategyView />
    </QueryProvider>
  );
}
