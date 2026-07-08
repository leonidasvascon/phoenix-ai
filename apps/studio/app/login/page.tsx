"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { apiFetch, clearApiKey, getConfiguredApiKey, saveApiKey } from "../api-client";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState(getConfiguredApiKey);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    saveApiKey(apiKey.trim());

    try {
      const response = await apiFetch("/brands");

      if (!response.ok) {
        clearApiKey();
        setError(response.status === 403 ? "Chave invalida." : "Nao foi possivel autenticar.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      clearApiKey();
      setError("A API Phoenix nao esta disponivel.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <header>
          <p>Phoenix Studio</p>
          <h1>Entrar</h1>
        </header>
        <form onSubmit={handleSubmit}>
          <label>
            Chave de acesso
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
