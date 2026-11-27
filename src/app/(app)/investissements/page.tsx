import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Investissements" };

export default async function InvestmentsPage() {
  await requireAuth();

  return (
    <>
      <PageHeader title="Investissements" description="PEA, PEE et cryptoactifs." />
      <ComingSoon />
    </>
  );
}
