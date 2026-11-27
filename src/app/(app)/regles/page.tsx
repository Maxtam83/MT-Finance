import type { Metadata } from "next";
import { EmptyState } from "@/components/molecules/empty-state";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Règles & Tags" };

/** Page des règles et des tags. */
export default async function RulesPage() {
  await requireAuth();

  return (
    <PageTemplate title="Règles & Tags" description="Catégorisation de vos opérations.">
      <EmptyState message="Cette section arrivera dans un prochain lot." />
    </PageTemplate>
  );
}
