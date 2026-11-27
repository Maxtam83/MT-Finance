import type { Metadata } from "next";
import type { AllowedUser } from "@/components/molecules/allowed-user-row";
import { AccessManagementCard } from "@/components/organisms/access-management-card";
import { LinkAccountCard } from "@/components/organisms/link-account-card";
import { PageTemplate } from "@/components/templates/page-template";
import { requireAdmin } from "@/lib/auth/guards";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Administration" };

/** Administrateur puis adresses autorisées, avec leur état d'inscription. */
async function listAllowedUsers(): Promise<AllowedUser[]> {
  const adminEmail = getEnv().ADMIN_EMAIL;
  const entries = await prisma.allowedEmail.findMany({
    where: { email: { not: adminEmail } },
    orderBy: { email: "asc" },
    select: { id: true, email: true },
  });
  const registered = await prisma.user.findMany({
    where: { email: { in: [adminEmail, ...entries.map((entry) => entry.email)] } },
    select: { email: true },
  });
  const registeredEmails = new Set(registered.map((user) => user.email));

  return [
    { allowedEmailId: null, email: adminEmail },
    ...entries.map((entry) => ({ allowedEmailId: entry.id, email: entry.email })),
  ].map((user) => ({ ...user, isRegistered: registeredEmails.has(user.email) }));
}

/** Page d'administration, réservée à l'administrateur. */
export default async function AdminPage() {
  await requireAdmin();
  const users = await listAllowedUsers();

  return (
    <PageTemplate title="Administration" description="Accès à l'application et comptes joints.">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <AccessManagementCard users={users} />
        <LinkAccountCard />
      </div>
    </PageTemplate>
  );
}
