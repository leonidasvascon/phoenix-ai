"use client";

import { type FormEvent, useState } from "react";
import { apiFetch } from "../../api-client";

export default function AccountSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await apiFetch("/auth/password/change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    setStatus(response.ok ? "Senha atualizada." : "Nao foi possivel atualizar a senha.");
  }

  return (
    <main className="studio-page">
      <header className="page-header"><div><p>Phoenix Identity</p><h1>Seguranca</h1></div></header>
      <form className="panel" onSubmit={save}>
        <label>Senha atual<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
        <label>Nova senha<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
        <button type="submit">Salvar senha</button>
        {status ? <p>{status}</p> : null}
      </form>
    </main>
  );
}
