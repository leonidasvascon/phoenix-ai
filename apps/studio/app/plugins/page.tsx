"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../api-client";

type PluginRecord = {
  id: string;
  manifest: {
    id: string;
    name: string;
    version: string;
    engine: string;
    author: string;
    capabilities: string[];
    description?: string;
  };
  status: "installed" | "enabled" | "disabled" | "invalid";
  installedAt: string;
  enabledAt?: string;
  disabledAt?: string;
  error?: string;
  logs: Array<{ timestamp: string; level: "info" | "warn" | "error"; message: string }>;
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginRecord[]>([]);
  const [message, setMessage] = useState("");

  async function loadPlugins() {
    const response = await apiFetch("/plugins");
    if (response.ok) setPlugins(await response.json() as PluginRecord[]);
  }

  async function pluginAction(action: "install" | "enable" | "disable", id: string) {
    const response = await apiFetch(`/plugins/${action}`, {
      method: "POST",
      body: JSON.stringify({ id })
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? `${action} executado para ${id}.` : payload.message ?? "Falha ao executar acao.");
    await loadPlugins();
  }

  async function uninstallPlugin(id: string) {
    const response = await apiFetch(`/plugins/${encodeURIComponent(id)}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Plugin ${id} removido.` : payload.message ?? "Falha ao remover plugin.");
    await loadPlugins();
  }

  useEffect(() => {
    void loadPlugins();
  }, []);

  return (
    <main className="studio-page">
      <header className="page-header">
        <div>
          <p>Extensibility</p>
          <h1>Plugins</h1>
        </div>
      </header>

      {message && <p className="status-message">{message}</p>}

      <section className="grid-list">
        {plugins.map((plugin) => (
          <article className="panel" key={plugin.id}>
            <header className="panel-header">
              <div>
                <p>{plugin.status}</p>
                <h2>{plugin.manifest.name}</h2>
              </div>
              <strong>{plugin.manifest.version}</strong>
            </header>
            <p>{plugin.manifest.description ?? "Sem descricao."}</p>
            <p><strong>Engine:</strong> {plugin.manifest.engine}</p>
            <p><strong>Autor:</strong> {plugin.manifest.author}</p>
            <p><strong>Capabilities:</strong> {plugin.manifest.capabilities.join(", ") || "nenhuma"}</p>
            {plugin.error && <p className="error-text">{plugin.error}</p>}
            <div className="button-row">
              <button type="button" onClick={() => void pluginAction("install", plugin.id)} disabled={plugin.status === "invalid"}>Instalar</button>
              <button type="button" onClick={() => void pluginAction("enable", plugin.id)} disabled={plugin.status === "enabled" || plugin.status === "invalid"}>Habilitar</button>
              <button type="button" onClick={() => void pluginAction("disable", plugin.id)} disabled={plugin.status !== "enabled"}>Desabilitar</button>
              <button type="button" onClick={() => void uninstallPlugin(plugin.id)} disabled={plugin.status === "invalid"}>Remover</button>
            </div>
            <details>
              <summary>Logs recentes</summary>
              <ul>
                {plugin.logs.slice(-5).map((log) => (
                  <li key={`${plugin.id}-${log.timestamp}-${log.message}`}>{log.timestamp} [{log.level}] {log.message}</li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </section>
    </main>
  );
}
