"use client";

import { useRouter } from "next/navigation";
import { apiFetch, clearApiKey } from "../app/api-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearApiKey();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="logout-button" type="button" onClick={handleLogout}>
      Sair
    </button>
  );
}
