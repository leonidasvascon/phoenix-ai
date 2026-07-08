import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function Navigation() {
  return (
    <nav className="studio-navigation" aria-label="Phoenix Studio">
      <Link href="/">Nova Task</Link>
      <Link href="/history">Historico</Link>
      <Link href="/analytics">Analytics</Link>
      <Link href="/brands">Marcas</Link>
      <LogoutButton />
    </nav>
  );
}
