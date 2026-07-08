"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { getApiKey } from "../app/api-client";

export function AuthGuard({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = pathname === "/login";
  const [isAuthenticated, setIsAuthenticated] = useState(isPublicRoute);

  useEffect(() => {
    if (isPublicRoute) {
      setIsAuthenticated(true);
      return;
    }

    if (!getApiKey()) {
      setIsAuthenticated(false);
      router.replace("/login");
      return;
    }

    setIsAuthenticated(true);
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
