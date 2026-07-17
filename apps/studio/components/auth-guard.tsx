"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { apiFetch, getApiKey } from "../app/api-client";

export function AuthGuard({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/auth/callback") || pathname.startsWith("/invitations/");
  const [isAuthenticated, setIsAuthenticated] = useState(isPublicRoute);

  useEffect(() => {
    if (isPublicRoute) {
      setIsAuthenticated(true);
      return;
    }

    let cancelled = false;
    async function verifySession() {
      if (getApiKey()) {
        setIsAuthenticated(true);
        return;
      }
      const response = await apiFetch("/auth/me");
      if (cancelled) return;
      if (response.ok) {
        setIsAuthenticated(true);
        return;
      }
      setIsAuthenticated(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    void verifySession();
    return () => {
      cancelled = true;
    };
  }, [isPublicRoute, pathname, router]);

  if (!isPublicRoute && !isAuthenticated) {
    return (
      <main className="session-loading" aria-live="polite">
        Verificando sessao...
      </main>
    );
  }

  return children;
}
