import type { Metadata } from "next";
import { PendingRequestsNotice } from "@/components/molecules/pending-requests-notice";
import { PasskeyCard } from "@/components/organisms/passkey-card";
import { SessionCard } from "@/components/organisms/session-card";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAuth } from "@/lib/auth/guards";
import { countReceivedRequests } from "@/lib/joint-accounts/queries";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

/** Page d'accueil : demandes en attente, compte connecté et passkeys. */
export default async function DashboardPage() {
  const { user } = await requireAuth();
  const [passkeyCount, requestCount] = await Promise.all([
    prisma.passkey.count({ where: { userId: user.id } }),
    countReceivedRequests(user.email),
  ]);

  return (
    <PageTemplate title="Dashboard" description="La vue d'ensemble arrivera dans un prochain lot.">
      <PendingRequestsNotice count={requestCount} />
      <div className="grid gap-4 md:grid-cols-2">
        <SessionCard email={user.email} role={user.role} />
        <PasskeyCard passkeyCount={passkeyCount} />
      </div>
    </PageTemplate>
  );
}
