"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Navigation } from "../../components/navigation";
import { apiFetch, saveWorkspaceId } from "../api-client";
import { QueryProvider } from "../query-provider";

type Workspace = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

function WorkspacesView() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const workspaces = useQuery({
    queryKey: ["workspaces"],
    queryFn: async (): Promise<Workspace[]> => {
      const response = await apiFetch("/workspaces");
      if (!response.ok) throw new Error("Nao foi possivel carregar workspaces.");
      return response.json();
    }
  });
  const createWorkspace = useMutation({
    mutationFn: async () => {
      const response = await apiFetch("/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error("Nao foi possivel criar workspace.");
      return response.json() as Promise<Workspace>;
    },
    onSuccess: (workspace) => {
      saveWorkspaceId(workspace.id);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createWorkspace.mutate();
  }

  return (
    <main className="brands-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Enterprise</p>
          <h1>Workspaces</h1>
        </div>
      </section>

      <form className="settings-form" onSubmit={handleSubmit}>
        <section>
          <h2>Novo workspace</h2>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Equipe Marketing" />
          </label>
          <button type="submit" disabled={!name.trim() || createWorkspace.isPending}>
            Criar workspace
          </button>
        </section>
      </form>

      {workspaces.error ? <p className="error">{workspaces.error.message}</p> : null}
      <section className="brand-list">
        {workspaces.data?.map((workspace) => (
          <article className="brand-card" key={workspace.id}>
            <p>{workspace.status}</p>
            <h2>{workspace.name}</h2>
            <p className="muted">{workspace.id}</p>
            <Link href={`/workspaces/${workspace.id}`}>Abrir workspace</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function WorkspacesPage() {
  return (
    <QueryProvider>
      <WorkspacesView />
    </QueryProvider>
  );
}
