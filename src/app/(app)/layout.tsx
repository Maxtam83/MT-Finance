import type { ReactNode } from "react";
import { AppShell } from "@/components/templates/app-shell";
import { requireAuth } from "@/lib/auth/guards";

/** Mise en page des pages protégées. */
export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = await requireAuth();

  return (
    <AppShell isAdmin={user.role === "ADMIN"} email={user.email}>
      {children}
    </AppShell>
  );
}
