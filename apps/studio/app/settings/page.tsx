"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { Navigation } from "../../components/navigation";
import { apiFetch } from "../api-client";
import { QueryProvider } from "../query-provider";

type RuntimeSettings = {
  phoenix_provider: string;
  phoenix_api_url: string;
  quality_min_score: number;
  max_attempts: number;
  output_root: string;
};

const emptySettings: RuntimeSettings = {
  phoenix_provider: "mock",
  phoenix_api_url: "http://127.0.0.1:4000",
  quality_min_score: 90,
  max_attempts: 2,
  output_root: "output"
};

function SettingsView() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RuntimeSettings>(emptySettings);

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<RuntimeSettings> => {
      const response = await apiFetch("/settings");

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar configuracoes.");
      }

      return response.json();
    }
  });

  const saveSettings = useMutation({
    mutationFn: async (payload: RuntimeSettings): Promise<RuntimeSettings> => {
      const response = await apiFetch("/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar configuracoes.");
      }

      return response.json();
    },
    onSuccess: (saved) => {
      setForm(saved);
      queryClient.setQueryData(["settings"], saved);
    }
  });

  useEffect(() => {
    if (settings.data) {
      setForm(settings.data);
    }
  }, [settings.data]);

  function updateField<K extends keyof RuntimeSettings>(field: K, value: RuntimeSettings[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSettings.mutate(form);
  }

  return (
    <main className="settings-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Configuracoes</h1>
      </section>

      {settings.isLoading ? <p className="muted">Carregando configuracoes...</p> : null}
      {settings.error ? <p className="error">{settings.error.message}</p> : null}
      {saveSettings.error ? <p className="error">{saveSettings.error.message}</p> : null}
      {saveSettings.isSuccess ? <p className="success">Configuracoes salvas com sucesso.</p> : null}

      <form className="settings-form" onSubmit={handleSubmit}>
        <section>
          <h2>Runtime</h2>
          <label>
            PHOENIX_PROVIDER
            <select
              value={form.phoenix_provider}
              onChange={(event) => updateField("phoenix_provider", event.target.value)}
            >
              <option value="mock">mock</option>
              <option value="openai">openai</option>
            </select>
          </label>
          <label>
            PHOENIX_API_URL
            <input
              value={form.phoenix_api_url}
              onChange={(event) => updateField("phoenix_api_url", event.target.value)}
              placeholder="http://127.0.0.1:4000"
            />
          </label>
          <label>
            Pasta de output
            <input
              value={form.output_root}
              onChange={(event) => updateField("output_root", event.target.value)}
              placeholder="output"
            />
          </label>
        </section>

        <section>
          <h2>Quality Gate</h2>
          <label>
            Quality score minimo
            <input
              max={100}
              min={0}
              type="number"
              value={form.quality_min_score}
              onChange={(event) => updateField("quality_min_score", Number(event.target.value))}
            />
          </label>
          <label>
            Maximo de tentativas
            <input
              max={5}
              min={1}
              type="number"
              value={form.max_attempts}
              onChange={(event) => updateField("max_attempts", Number(event.target.value))}
            />
          </label>
        </section>

        <div className="settings-actions">
          <button type="submit" disabled={saveSettings.isPending || settings.isLoading}>
            {saveSettings.isPending ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <QueryProvider>
      <SettingsView />
    </QueryProvider>
  );
}
