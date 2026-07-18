"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../api-client";

type Workflow = {
  id: string;
  name: string;
  description?: string;
  nodes: Array<{ id: string; type: string; name: string; config?: Record<string, unknown>; position?: { x: number; y: number } }>;
  edges: Array<{ id: string; from: string; to: string; condition?: string }>;
  metadata: { workspace_id: string; updated_at: string };
};

type WorkflowExecution = {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string;
  steps: Array<{ node_id: string; node_type: string; status: string; error?: string }>;
  error?: string;
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [message, setMessage] = useState("");

  async function loadWorkflows() {
    const response = await apiFetch("/workflows");
    if (response.ok) {
      const items = await response.json() as Workflow[];
      setWorkflows(items);
      if (!selected && items[0]) setSelected(items[0]);
    }
  }

  async function loadExecutions(workflowId: string) {
    const response = await apiFetch(`/workflows/${workflowId}/executions`);
    if (response.ok) setExecutions(await response.json() as WorkflowExecution[]);
  }

  async function createDefaultWorkflow() {
    const response = await apiFetch("/workflows", {
      method: "POST",
      body: JSON.stringify({
        name: "Autonomous Content Pipeline",
        description: "Scheduler -> Strategy -> Task -> Evaluation -> Publishing -> Notification"
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setSelected(payload as Workflow);
      setMessage("Workflow criado.");
      await loadWorkflows();
      return;
    }
    setMessage(payload.message ?? "Falha ao criar workflow.");
  }

  async function runSelectedWorkflow() {
    if (!selected) return;
    const response = await apiFetch(`/workflows/${selected.id}/run`, { method: "POST", body: JSON.stringify({}) });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Execucao ${payload.id} finalizada com ${payload.status}.` : payload.message ?? "Falha ao executar workflow.");
    await loadExecutions(selected.id);
  }

  useEffect(() => {
    void loadWorkflows();
  }, []);

  useEffect(() => {
    if (selected) void loadExecutions(selected.id);
  }, [selected?.id]);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Automation</p>
          <h1>Workflows</h1>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => void createDefaultWorkflow()}>Novo workflow</button>
          <button type="button" onClick={() => void runSelectedWorkflow()} disabled={!selected}>Executar</button>
        </div>
      </header>

      {message && <p className="status-message">{message}</p>}

      <section className="dashboard-grid">
        <aside className="panel">
          <h2>Fluxos</h2>
          {workflows.length === 0 && <p>Nenhum workflow criado.</p>}
          {workflows.map((workflow) => (
            <button className="list-button" key={workflow.id} type="button" onClick={() => setSelected(workflow)}>
              <strong>{workflow.name}</strong>
              <span>{workflow.nodes.length} nos</span>
            </button>
          ))}
        </aside>

        <section className="panel">
          <h2>{selected?.name ?? "Canvas"}</h2>
          {!selected && <p>Crie ou selecione um workflow.</p>}
          {selected && (
            <div className="workflow-canvas">
              {selected.nodes.map((node) => (
                <article className="workflow-node" key={node.id}>
                  <p>{node.type}</p>
                  <h3>{node.name}</h3>
                  <small>{selected.edges.filter((edge) => edge.from === node.id).map((edge) => `-> ${edge.to}`).join(" ")}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="panel">
          <h2>Execucoes</h2>
          {executions.length === 0 && <p>Sem execucoes ainda.</p>}
          {executions.map((execution) => (
            <article key={execution.id} className="compact-card">
              <strong>{execution.status}</strong>
              <p>{execution.steps.length} etapas</p>
              {execution.error && <p className="error-text">{execution.error}</p>}
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}
