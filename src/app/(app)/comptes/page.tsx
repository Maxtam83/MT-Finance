import type { Metadata } from "next";
import { AccountsSection } from "@/components/organisms/accounts-section";
import { ReceivedRequestsSection } from "@/components/organisms/received-requests-section";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAuth } from "@/lib/auth/guards";
import { listAccountSummaries, listReceivedRequests } from "@/lib/joint-accounts/queries";

export const metadata: Metadata = { title: "Comptes" };

/** Comptes de la personne connectée et demandes de compte joint. */
export default async function AccountsPage() {
  const { user } = await requireAuth();
  const [requests, accounts] = await Promise.all([
    listReceivedRequests(user.email),
    listAccountSummaries(user.id),
  ]);

  return (
    <PageTemplate title="Comptes" description="Vos comptes et leur partage.">
      <ReceivedRequestsSection requests={requests} />
      <AccountsSection accounts={accounts} />
    </PageTemplate>
  );
}
