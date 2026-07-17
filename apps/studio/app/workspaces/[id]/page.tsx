"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navigation } from "../../../components/navigation";
import { apiFetch, saveWorkspaceId } from "../../api-client";
import { QueryProvider } from "../../query-provider";

type Workspace = {
  id: string;
  name: string;
  status: string;
  settings: Record<string, unknown>;
};

function WorkspaceDetailView() {
  const params = useParams<{ id: string }>();
  const workspaceId = params.id;
  const workspace = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async (): Promise<Workspace> => {
      const response = await apiFetch(`/workspaces/${workspaceId}`);
      if (!response.ok) throw new Error("Workspace nao encontrado.");
      return response.json();
    }
  });

  return (
    <main className="settings-shell">
      <Navigation />
      <section className="history-heading history-heading-actions">
        <div>
          <p>Phoenix Enterprise</p>
          <h1>{workspace.data?.name ?? "Workspace"}</h1>
        </div>
        <div className="heading-actions">
          <Link href={`/workspaces/${workspaceId}/members`}>Membros</Link>
          <Link href={`/workspaces/${workspaceId}/settings`}>Configuracoes</Link>
        </div>
      </section>

      {workspace.error ? <p className="error">{workspace.error.message}</p> : null}
      {workspace.data ? (
        <section className="settings-form">
          <section>
            <h2>Dados</h2>
            <p>ID: {workspace.data.id}</p>
            <p>Status: {workspace.data.status}</p>
            <button type="button" onClick={() => saveWorkspaceId(workspace.data.id)}>
              Usar este workspace
            </button>
          </section>
          <section>
            <h2>Settings</h2>
            <pre className="output-block">{JSON.stringify(workspace.data.settings, null, 2)}</pre>
          </section>
        </section>
      ) : null}
    </main>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <QueryProvider>
      <WorkspaceDetailView />
    </QueryProvider>
  );
}
