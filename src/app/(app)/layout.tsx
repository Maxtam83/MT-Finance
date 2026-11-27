import type { ReactNode } from "react";
import { AppShell } from "@/components/templates/app-shell";
import { requireAuth } from "@/lib/auth/guards";
import { countReceivedRequests } from "@/lib/joint-accounts/queries";

/** Mise en page des pages protégées. */
export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = await requireAuth();
  // Recalculé au chargement de l'application et après chaque action sur une demande.
  const pendingRequestCount = await countReceivedRequests(user.email);

  return (
    <AppShell
      isAdmin={user.role === "ADMIN"}
      email={user.email}
      pendingRequestCount={pendingRequestCount}
    >
      {children}
    </AppShell>
  );
}
