import type { Metadata } from "next";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Comptes" };

/** Page des comptes. */
export default async function AccountsPage() {
  await requireAuth();

  return (
    <PageTemplate title="Comptes" description="Comptes bancaires et comptes joints.">
      <EmptyState message="Cette section arrivera dans un prochain lot." />
    </PageTemplate>
  );
}
