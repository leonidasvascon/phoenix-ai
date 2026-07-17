"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "../../../../components/navigation";
import { apiFetch } from "../../../api-client";
import { QueryProvider } from "../../../query-provider";

type Workspace = {
  id: string;
  name: string;
  settings: Record<string, unknown>;
};

function WorkspaceSettingsView() {
  const params = useParams<{ id: string }>();
  const workspaceId = params.id;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [settings, setSettings] = useState("{}");
  const workspace = useQuery({
    queryKey: ["workspace-settings", workspaceId],
    queryFn: async (): Promise<Workspace> => {
      const response = await apiFetch(`/workspaces/${workspaceId}`);
      if (!response.ok) throw new Error("Nao foi possivel carregar workspace.");
      return response.json();
    }
  });
  const save = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, settings: JSON.parse(settings) as Record<string, unknown> })
      });
      if (!response.ok) throw new Error("Nao foi possivel salvar configuracoes.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-settings", workspaceId] })
  });

  useEffect(() => {
    if (workspace.data) {
      setName(workspace.data.name);
      setSettings(JSON.stringify(workspace.data.settings, null, 2));
    }
  }, [workspace.data]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <main className="settings-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Enterprise</p>
        <h1>Configuracoes do workspace</h1>
      </section>
      {save.error ? <p className="error">{save.error.message}</p> : null}
      <form className="settings-form" onSubmit={submit}>
        <section>
          <h2>Workspace</h2>
          <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Settings JSON<textarea value={settings} onChange={(event) => setSettings(event.target.value)} rows={10} /></label>
          <button type="submit">Salvar</button>
        </section>
      </form>
    </main>
  );
}

export default function WorkspaceSettingsPage() {
  return <QueryProvider><WorkspaceSettingsView /></QueryProvider>;
}
