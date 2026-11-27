import type { Metadata } from "next";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Investissements" };

/** Page des investissements. */
export default async function InvestmentsPage() {
  await requireAuth();

  return (
    <PageTemplate title="Investissements" description="PEA, PEE et cryptoactifs.">
      <EmptyState message="Cette section arrivera dans un prochain lot." />
    </PageTemplate>
  );
}
