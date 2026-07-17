"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { apiFetch, clearApiKey, getConfiguredApiKey, saveApiKey } from "../api-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="session-loading">Carregando login...</main>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState(getConfiguredApiKey);
  const [mode, setMode] = useState<"user" | "service">("user");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    clearApiKey();

    try {
      if (mode === "service") {
        saveApiKey(apiKey.trim());
        const response = await apiFetch("/brands");
        if (!response.ok) throw new Error(response.status === 403 ? "Chave invalida." : "Nao foi possivel autenticar.");
      } else {
        const response = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Email ou senha invalidos.");
      }

      router.replace(search.get("next") ?? "/");
      router.refresh();
    } catch (caught) {
      clearApiKey();
      setError(caught instanceof Error ? caught.message : "A API Phoenix nao esta disponivel.");
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
        <div className="segmented-control">
          <button type="button" aria-pressed={mode === "user"} onClick={() => setMode("user")}>Usuario</button>
          <button type="button" aria-pressed={mode === "service"} onClick={() => setMode("service")}>Chave</button>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === "user" ? (
            <>
              <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
              <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
            </>
          ) : (
            <label>Chave de acesso<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="current-password" required /></label>
          )}
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={isLoading}>{isLoading ? "Validando..." : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}
