import type { Metadata } from "next";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Import" };

/** Page d'import des relevés. */
export default async function ImportPage() {
  await requireAuth();

  return (
    <PageTemplate title="Import" description="Import de relevés bancaires.">
      <EmptyState message="Cette section arrivera dans un prochain lot." />
    </PageTemplate>
  );
}
