import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function Navigation() {
  return (
    <nav className="studio-navigation" aria-label="Phoenix Studio">
      <Link href="/">Nova Task</Link>
      <Link href="/batch">Batch</Link>
      <Link href="/scheduler">Scheduler</Link>
      <Link href="/history">Historico</Link>
      <Link href="/analytics">Analytics</Link>
      <Link href="/brands">Marcas</Link>
      <Link href="/settings">Configuracoes</Link>
      <Link href="/templates">Templates</Link>
      <LogoutButton />
    </nav>
  );
}
