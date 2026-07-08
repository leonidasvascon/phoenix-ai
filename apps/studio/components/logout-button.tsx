"use client";

import { useRouter } from "next/navigation";
import { clearApiKey } from "../app/api-client";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
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
