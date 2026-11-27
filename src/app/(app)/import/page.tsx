import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  await requireAuth();

  return (
    <>
      <PageHeader title="Import" description="Import de relevés bancaires." />
      <ComingSoon />
    </>
  );
}
