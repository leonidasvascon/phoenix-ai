import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { auditIdentity, createLocalUser, findUserByEmail, saveUser } from "./identity-service.ts";
import { providersRoot, readJson, writeJson } from "./identity-repository.ts";
import { createSession, buildSessionCookie } from "./session-service.ts";
import type { IdentityUser } from "./types.ts";

export type OidcProviderConfig = {
  id: string;
  configured: boolean;
  ready: boolean;
  issuer?: string;
  client_id?: string;
  redirect_uri?: string;
};

export function listOidcProviders(): OidcProviderConfig[] {
  return ["mock", "google", "microsoft"].map(getOidcProviderConfig);
}

export function getOidcProviderConfig(provider: string): OidcProviderConfig {
  if (provider === "mock") return { id: "mock", configured: true, ready: true, issuer: "mock", client_id: "mock", redirect_uri: "/auth/oidc/mock/callback" };
  const prefix = `PHOENIX_OIDC_${provider.toUpperCase()}`;
  const issuer = process.env[`${prefix}_ISSUER`];
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const redirectUri = process.env[`${prefix}_REDIRECT_URI`];
  const configured = Boolean(issuer && clientId && redirectUri);
  return { id: provider, configured, ready: (process.env.PHOENIX_OIDC_ENABLED ?? "false") === "true" && configured, issuer, client_id: clientId, redirect_uri: redirectUri };
}

export async function startOidcLogin(provider: string): Promise<{ redirect_url: string; state: string; nonce: string }> {
  const config = getOidcProviderConfig(provider);
  if (!config.ready) throw new Error("OIDC provider is not ready.");
  const state = `oidc_state_${randomUUID()}`;
  const nonce = `oidc_nonce_${randomUUID()}`;
  await writeJson(resolve(providersRoot(), `${state}.json`), { provider, state, nonce, created_at: new Date().toISOString(), used: false });
  await auditIdentity("identity.oidc.started", { provider, result: "info" });
  if (provider === "mock") return { state, nonce, redirect_url: `/auth/oidc/mock/callback?state=${encodeURIComponent(state)}&nonce=${encodeURIComponent(nonce)}&email=mock@example.com&name=Mock%20User` };
  return { state, nonce, redirect_url: `${config.issuer}/authorize?response_type=code&client_id=${encodeURIComponent(config.client_id ?? "")}&redirect_uri=${encodeURIComponent(config.redirect_uri ?? "")}&state=${state}&nonce=${nonce}&code_challenge_method=S256` };
}

export async function completeOidcLogin(provider: string, query: URLSearchParams, metadata: { ip?: string; userAgent?: string } = {}) {
  const state = query.get("state") ?? "";
  const stored = await readJson<{ provider: string; nonce: string; used: boolean } | null>(resolve(providersRoot(), `${state}.json`), null);
  if (!stored || stored.used || stored.provider !== provider) {
    await auditIdentity("identity.oidc.failed", { provider, result: "failure", reasonCode: "invalid_state" });
    throw new Error("Invalid OIDC state.");
  }
  if (provider === "mock" && query.get("nonce") !== stored.nonce) throw new Error("Invalid OIDC nonce.");
  stored.used = true;
  await writeJson(resolve(providersRoot(), `${state}.json`), stored);
  const email = (query.get("email") ?? `${provider}-${randomUUID()}@example.com`).toLowerCase();
  const name = query.get("name") ?? email;
  let user = await findUserByEmail(email);
  if (!user) {
    user = await createLocalUser({ email, name, password: `Temp-${randomUUID()}-Password`, email_verified: true });
  }
  linkIdentity(user, provider, query.get("sub") ?? email);
  await saveUser(user);
  const session = await createSession(user.id, metadata);
  await auditIdentity("identity.oidc.succeeded", { userId: user.id, sessionId: session.id, provider, result: "success" });
  return { user, session, setCookie: buildSessionCookie(session.id) };
}

function linkIdentity(user: IdentityUser, provider: string, subject: string): void {
  if (!user.identities.some((identity) => identity.provider === provider && identity.subject === subject)) {
    user.identities.push({ provider, subject });
  }
}
