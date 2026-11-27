import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Règles & Tags" };

export default async function RulesPage() {
  await requireAuth();

  return (
    <>
      <PageHeader title="Règles & Tags" description="Catégorisation de vos opérations." />
      <ComingSoon />
    </>
  );
}
