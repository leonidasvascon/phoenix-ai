"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../api-client";
import type { SecretMetadataView } from "../../../../components/secret-metadata-card";

export default function SecretDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [secret, setSecret] = useState<SecretMetadataView | null>(null);
  const [rotationValue, setRotationValue] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await apiFetch(`/secrets/${encodeURIComponent(params.id)}`);
    if (response.ok) setSecret(await response.json() as SecretMetadataView);
  }

  useEffect(() => { void load(); }, []);

  async function validate() {
    const response = await apiFetch(`/secrets/${encodeURIComponent(params.id)}/validate`, { method: "POST" });
    setMessage(response.ok ? JSON.stringify(await response.json()) : "Validacao falhou.");
  }

  async function rotate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await apiFetch(`/secrets/${encodeURIComponent(params.id)}/rotate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: rotationValue }) });
    setRotationValue("");
    setMessage(response.ok ? "Segredo rotacionado." : "Rotacao falhou.");
    await load();
  }

  async function revoke() {
    if (!confirm("Revogar este segredo?")) return;
    await apiFetch(`/secrets/${encodeURIComponent(params.id)}/revoke`, { method: "POST" });
    router.replace("/settings/secrets");
  }

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Security</p><h1>{secret?.name ?? "Secret"}</h1></div></header>
      {secret ? <section className="panel"><p>{secret.reference}</p><p>Status: {secret.status}</p><p>Versao: {secret.version}</p><button type="button" onClick={validate}>Validar</button><button type="button" onClick={revoke}>Revogar</button></section> : <p>Secret nao encontrado.</p>}
      <form className="panel" onSubmit={rotate}>
        <label>Novo valor<input type="password" value={rotationValue} onChange={(event) => setRotationValue(event.target.value)} required /></label>
        <button type="submit">Rotacionar</button>
      </form>
      {message ? <pre>{message}</pre> : null}
    </main>
  );
}
