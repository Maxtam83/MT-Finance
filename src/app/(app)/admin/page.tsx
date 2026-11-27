import type { Metadata } from "next";
import { AddEmailForm } from "@/components/admin/add-email-form";
import { AllowedUsersList } from "@/components/admin/allowed-users-list";
import type { AllowedUser } from "@/components/admin/allowed-users-list";
import { LinkAccountForm } from "@/components/admin/link-account-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Administration" };

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

export default async function AdminPage() {
  await requireAdmin();
  const users = await listAllowedUsers();

  return (
    <>
      <PageHeader title="Administration" description="Accès à l'application et comptes joints." />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des accès</CardTitle>
            <CardDescription>Seules ces adresses peuvent se connecter.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <AddEmailForm />
            <AllowedUsersList users={users} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compte joint (accès à l&apos;aveugle)</CardTitle>
            <CardDescription>
              Ajoute un membre à un compte sans afficher son nom ni ses données. L&apos;identifiant
              est à demander à son propriétaire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkAccountForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
