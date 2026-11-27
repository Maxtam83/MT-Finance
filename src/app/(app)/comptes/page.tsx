import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Comptes" };

export default async function AccountsPage() {
  await requireAuth();

  return (
    <>
      <PageHeader title="Comptes" description="Comptes bancaires et comptes joints." />
      <ComingSoon />
    </>
  );
}
