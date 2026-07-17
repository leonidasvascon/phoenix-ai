"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "../../../../components/navigation";
import { apiFetch } from "../../../api-client";
import { QueryProvider } from "../../../query-provider";

type Member = {
  id: string;
  user_id: string;
  name: string;
  role: string;
  status: string;
};

function MembersView() {
  const params = useParams<{ id: string }>();
  const workspaceId = params.id;
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", user_id: "", role: "editor" });
  const members = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async (): Promise<Member[]> => {
      const response = await apiFetch(`/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error("Nao foi possivel carregar membros.");
      return response.json();
    }
  });
  const add = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error("Nao foi possivel adicionar membro.");
    },
    onSuccess: () => {
      setForm({ name: "", user_id: "", role: "editor" });
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
    }
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    add.mutate();
  }

  return (
    <main className="settings-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Enterprise</p>
        <h1>Membros</h1>
      </section>

      <form className="settings-form" onSubmit={submit}>
        <section>
          <h2>Adicionar membro</h2>
          <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>User ID<input value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} /></label>
          <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select></label>
          <button type="submit">Adicionar</button>
        </section>
      </form>

      {members.error ? <p className="error">{members.error.message}</p> : null}
      <section className="brand-list">
        {members.data?.map((member) => (
          <article className="brand-card" key={member.id}>
            <p>{member.role}</p>
            <h2>{member.name}</h2>
            <p className="muted">{member.user_id}</p>
            <p>{member.status}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function MembersPage() {
  return <QueryProvider><MembersView /></QueryProvider>;
}
