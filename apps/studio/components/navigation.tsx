import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { WorkspaceSelector } from "./workspace-selector";

export function Navigation() {
  return (
    <nav className="studio-navigation" aria-label="Phoenix Studio">
      <Link href="/">Nova Task</Link>
      <Link href="/batch">Batch</Link>
      <Link href="/scheduler">Scheduler</Link>
      <Link href="/history">Historico</Link>
      <Link href="/analytics">Analytics</Link>
      <Link href="/learning">Learning</Link>
      <Link href="/strategy">Strategy</Link>
      <Link href="/evaluation">Evaluation</Link>
      <Link href="/feedback">Feedback</Link>
      <Link href="/optimizations">Otimizacoes</Link>
      <Link href="/providers">Providers</Link>
      <Link href="/models">Modelos</Link>
      <Link href="/cost">Custos</Link>
      <Link href="/publications">Publicacoes</Link>
      <Link href="/operations">Operacoes</Link>
      <Link href="/developers">Desenvolvedores</Link>
      <Link href="/brands">Marcas</Link>
      <Link href="/settings">Configuracoes</Link>
      <Link href="/settings/system">Sistema</Link>
      <Link href="/settings/authentication">Autenticacao</Link>
      <Link href="/settings/secrets">Secrets</Link>
      <Link href="/settings/api-keys">API Keys</Link>
      <Link href="/plugins">Plugins</Link>
      <Link href="/workflows">Workflows</Link>
      <Link href="/events">Eventos</Link>
      <Link href="/webhooks">Webhooks</Link>
      <Link href="/knowledge">Knowledge</Link>
      <Link href="/templates">Templates</Link>
      <Link href="/workspaces">Workspaces</Link>
      <Link href="/account">Conta</Link>
      <WorkspaceSelector />
      <LogoutButton />
    </nav>
  );
}
