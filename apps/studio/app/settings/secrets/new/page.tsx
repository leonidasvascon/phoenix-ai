"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../api-client";

export default function NewSecretPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", namespace: "openai", provider: "encrypted_file", value: "", envName: "" });
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await apiFetch("/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!response.ok) {
      setError("Nao foi possivel criar o segredo.");
      return;
    }
    const secret = await response.json() as { id: string };
    router.replace(`/settings/secrets/${secret.id}`);
  }

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Security</p><h1>Novo segredo</h1></div></header>
      <form className="panel" onSubmit={submit}>
        <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Namespace<input value={form.namespace} onChange={(event) => setForm({ ...form, namespace: event.target.value })} required /></label>
        <label>Provider<select value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })}><option value="encrypted_file">encrypted_file</option><option value="environment">environment</option><option value="memory">memory</option></select></label>
        {form.provider === "environment" ? <label>Env var<input value={form.envName} onChange={(event) => setForm({ ...form, envName: event.target.value })} /></label> : <label>Valor<input type="password" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} required /></label>}
        <p>O valor digitado sera exibido somente agora e nunca reaparece depois de salvo.</p>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Criar segredo</button>
      </form>
    </main>
  );
}
