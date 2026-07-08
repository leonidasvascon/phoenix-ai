import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthGuard } from "../components/auth-guard";
import "./styles.css";

export const metadata: Metadata = {
  title: "Phoenix Studio",
  description: "Creative operating system for Phoenix AI."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
