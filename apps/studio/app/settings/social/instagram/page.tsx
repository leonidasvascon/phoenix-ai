"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navigation } from "../../../../components/navigation";
import { apiFetch } from "../../../api-client";
import { QueryProvider } from "../../../query-provider";

type SocialConnection = {
  id: string;
  workspaceId: string;
  brandId?: string;
  provider: "instagram";
  accountId: string;
  accountUsername?: string;
  accountName?: string;
  accountType?: "business" | "creator";
  facebookPageId?: string;
  graphApiVersion: string;
  publicMediaBaseUrl?: string;
  accessTokenMasked: string;
  tokenExpiresAt?: string;
  status: "connected" | "invalid" | "expired" | "missing_permissions" | "disconnected";
  permissions: string[];
  lastCheckedAt?: string;
  ready: boolean;
};

type TestResult = {
  status: "success" | "incomplete";
  ready: boolean;
  message: string;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  connection: SocialConnection;
};

const permissions = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement"
];

function InstagramConnectionView() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    brandId: "encanto-intenso",
    accountId: "",
    accountUsername: "",
    accountName: "",
    accountType: "business",
    facebookPageId: "",
    graphApiVersion: "v23.0",
    publicMediaBaseUrl: "",
    accessToken: "",
    permissions
  });
  const [selectedId, setSelectedId] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const connections = useQuery({
    queryKey: ["social-connections"],
    queryFn: async (): Promise<SocialConnection[]> => {
      const response = await apiFetch("/social-connections");
      if (!response.ok) throw new Error("Não foi possível carregar canais sociais.");
      return response.json();
    }
  });
  const instagramConnections = useMemo(
    () => connections.data?.filter((connection) => connection.provider === "instagram") ?? [],
    [connections.data]
  );

  const saveConnection = useMutation({
    mutationFn: async () => {
      const targetId = selectedId || instagramConnections[0]?.id;
      const payload = {
        ...form,
        accessToken: form.accessToken || undefined
      };
      const response = await apiFetch(targetId ? `/social-connections/${targetId}` : "/social-connections/instagram", {
        method: targetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Não foi possível salvar a conexão." }));
        throw new Error(error.message ?? "Não foi possível salvar a conexão.");
      }
      return response.json() as Promise<SocialConnection>;
    },
    onSuccess: async (connection) => {
      setSelectedId(connection.id);
      setForm((current) => ({ ...current, accessToken: "" }));
      await queryClient.invalidateQueries({ queryKey: ["social-connections"] });
    }
  });

  const testConnection = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/social-connections/${id}/test`, { method: "POST" });
      if (!response.ok) throw new Error("Não foi possível testar a conexão.");
      return response.json() as Promise<TestResult>;
    },
    onSuccess: async (result) => {
      setTestResult(result);
      await queryClient.invalidateQueries({ queryKey: ["social-connections"] });
    }
  });

  const disconnect = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/social-connections/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível desconectar.");
      return response.json();
    },
    onSuccess: async () => {
      setSelectedId("");
      setTestResult(null);
      await queryClient.invalidateQueries({ queryKey: ["social-connections"] });
    }
  });

  const activeConnection = instagramConnections.find((connection) => connection.id === selectedId) ?? instagramConnections[0];

  function loadConnection(connection: SocialConnection) {
    setSelectedId(connection.id);
    setForm({
      brandId: connection.brandId ?? "encanto-intenso",
      accountId: connection.accountId,
      accountUsername: connection.accountUsername ?? "",
      accountName: connection.accountName ?? "",
      accountType: connection.accountType ?? "business",
      facebookPageId: connection.facebookPageId ?? "",
      graphApiVersion: connection.graphApiVersion,
      publicMediaBaseUrl: connection.publicMediaBaseUrl ?? "",
      accessToken: "",
      permissions: connection.permissions.length ? connection.permissions : permissions
    });
  }

  return (
    <main className="settings-shell">
      <Navigation />
      <section className="history-heading">
        <p>Phoenix Studio</p>
        <h1>Canais Sociais</h1>
      </section>

      <section className="publication-prep">
        <header>
          <div>
            <p>Instagram</p>
            <h2>{activeConnection?.ready ? "Instagram conectado" : "Conectar Instagram"}</h2>
          </div>
          {activeConnection ? <span data-kind={activeConnection.ready ? "success" : "warning"}>{activeConnection.status}</span> : null}
        </header>

        <div className="empty-state">
          <h2>Conexão recomendada</h2>
          <p>O fluxo OAuth com Facebook / Instagram será habilitado na Sprint 65. Ele permitirá escolher Página, conta profissional e permissões automaticamente.</p>
          <button type="button" disabled>Conectar com Facebook / Instagram</button>
        </div>

        <h2>Configuração manual avançada</h2>
        <p className="muted">Use somente para desenvolvimento e diagnóstico. O token é enviado para a API e salvo criptografado no backend.</p>

        {connections.isLoading ? <p className="muted">Carregando conexões...</p> : null}
        {connections.error ? <p className="error">{connections.error.message}</p> : null}

        {instagramConnections.length ? (
          <label>
            Conexão salva
            <select value={activeConnection?.id ?? ""} onChange={(event) => {
              const connection = instagramConnections.find((item) => item.id === event.target.value);
              if (connection) loadConnection(connection);
            }}>
              {instagramConnections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.accountUsername ? `@${connection.accountUsername}` : connection.accountId} - {connection.status}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {activeConnection ? (
          <dl>
            <div><dt>Conta</dt><dd>{activeConnection.accountUsername ? `@${activeConnection.accountUsername}` : activeConnection.accountId}</dd></div>
            <div><dt>Nome</dt><dd>{activeConnection.accountName ?? "-"}</dd></div>
            <div><dt>Tipo</dt><dd>{activeConnection.accountType ?? "-"}</dd></div>
            <div><dt>Token</dt><dd>{activeConnection.accessTokenMasked}</dd></div>
            <div><dt>Última verificação</dt><dd>{activeConnection.lastCheckedAt ? new Date(activeConnection.lastCheckedAt).toLocaleString("pt-BR") : "-"}</dd></div>
            <div><dt>URL pública</dt><dd>{activeConnection.publicMediaBaseUrl ? "Configurada" : "Ausente"}</dd></div>
            <div><dt>Publicação</dt><dd>{activeConnection.ready ? "Disponível" : "Bloqueada"}</dd></div>
          </dl>
        ) : null}

        <label>Marca vinculada<input value={form.brandId} onChange={(event) => setForm({ ...form, brandId: event.target.value })} /></label>
        <label>ID da conta do Instagram<input value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })} /></label>
        <label>Username<input value={form.accountUsername} onChange={(event) => setForm({ ...form, accountUsername: event.target.value })} /></label>
        <label>Nome da conta<input value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} /></label>
        <label>Tipo da conta
          <select value={form.accountType} onChange={(event) => setForm({ ...form, accountType: event.target.value })}>
            <option value="business">Business</option>
            <option value="creator">Creator</option>
          </select>
        </label>
        <label>ID da Página do Facebook<input value={form.facebookPageId} onChange={(event) => setForm({ ...form, facebookPageId: event.target.value })} /></label>
        <label>Versão da Graph API<input value={form.graphApiVersion} onChange={(event) => setForm({ ...form, graphApiVersion: event.target.value })} /></label>
        <label>URL pública dos arquivos<input value={form.publicMediaBaseUrl} placeholder="https://media.seudominio.com" onChange={(event) => setForm({ ...form, publicMediaBaseUrl: event.target.value })} /></label>
        <label>Token de acesso<input type="password" value={form.accessToken} placeholder={activeConnection ? "Deixe vazio para manter o token atual" : ""} onChange={(event) => setForm({ ...form, accessToken: event.target.value })} /></label>

        <fieldset>
          <legend>Permissões</legend>
          {permissions.map((permission) => (
            <label className="checkbox-label" key={permission}>
              <input
                type="checkbox"
                checked={form.permissions.includes(permission)}
                onChange={(event) => setForm({
                  ...form,
                  permissions: event.target.checked
                    ? [...form.permissions, permission]
                    : form.permissions.filter((item) => item !== permission)
                })}
              />
              {permission}
            </label>
          ))}
        </fieldset>

        <div className="action-row">
          <button type="button" onClick={() => saveConnection.mutate()} disabled={saveConnection.isPending}>
            {saveConnection.isPending ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" disabled={!activeConnection || testConnection.isPending} onClick={() => activeConnection ? testConnection.mutate(activeConnection.id) : undefined}>
            {testConnection.isPending ? "Testando..." : "Testar conexão"}
          </button>
          <button type="button" disabled={!activeConnection || disconnect.isPending} onClick={() => activeConnection ? disconnect.mutate(activeConnection.id) : undefined}>
            Desconectar
          </button>
        </div>

        {saveConnection.error ? <p className="error">{saveConnection.error.message}</p> : null}
        {testConnection.error ? <p className="error">{testConnection.error.message}</p> : null}
        {disconnect.error ? <p className="error">{disconnect.error.message}</p> : null}

        {testResult ? (
          <section>
            <h2>{testResult.ready ? "Conexão validada com sucesso" : "Conexão incompleta"}</h2>
            <p>{testResult.message}</p>
            <dl>
              {testResult.checks.map((check) => (
                <div key={check.name}>
                  <dt>{check.passed ? "✓" : "✕"} {check.name}</dt>
                  <dd>{check.message}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default function InstagramSocialPage() {
  return (
    <QueryProvider>
      <InstagramConnectionView />
    </QueryProvider>
  );
}
