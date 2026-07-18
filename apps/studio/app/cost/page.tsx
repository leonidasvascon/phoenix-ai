"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type CostReport = {
  total_cost: number;
  total_tokens: number;
  requests: number;
  cache_hits: number;
  cache_savings: number;
  by_provider: Record<string, number>;
  by_model: Record<string, number>;
  budgets: Array<{ scope_id: string; state: string; remaining: number; amount: number }>;
  alerts: Array<{ level: string; message: string }>;
};

function CostView() {
  const report = useQuery({
    queryKey: ["cost-report"],
    queryFn: async (): Promise<CostReport> => {
      const response = await apiFetch("/cost");
      if (!response.ok) throw new Error("Nao foi possivel carregar custos.");
      return response.json();
    }
  });

  return (
    <main className="providers-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Cost Intelligence</h1>
        <div className="button-row">
          <Link className="secondary-button" href="/cost/usage">Usage</Link>
          <Link className="secondary-button" href="/cost/budgets">Budgets</Link>
          <Link className="secondary-button" href="/cost/quotas">Quotas</Link>
          <Link className="secondary-button" href="/cost/cache">Cache</Link>
        </div>
      </section>
      {report.error ? <p className="error">{report.error.message}</p> : null}
      <section className="metrics-grid">
        <article className="metric-card"><span>Custo total</span><strong>${report.data?.total_cost ?? 0}</strong></article>
        <article className="metric-card"><span>Tokens</span><strong>{report.data?.total_tokens ?? 0}</strong></article>
        <article className="metric-card"><span>Requests</span><strong>{report.data?.requests ?? 0}</strong></article>
        <article className="metric-card"><span>Economia cache</span><strong>${report.data?.cache_savings ?? 0}</strong></article>
      </section>
      <section className="providers-grid">
        <article className="provider-card">
          <header><div><p>Providers</p><h2>Custo</h2></div></header>
          <dl>{Object.entries(report.data?.by_provider ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>${value}</dd></div>)}</dl>
        </article>
        <article className="provider-card">
          <header><div><p>Alertas</p><h2>{report.data?.alerts.length ?? 0}</h2></div></header>
          {report.data?.alerts.map((alert) => <p className="muted" key={alert.message}>{alert.level}: {alert.message}</p>)}
        </article>
      </section>
    </main>
  );
}

export default function CostPage() {
  return <QueryProvider><CostView /></QueryProvider>;
}
