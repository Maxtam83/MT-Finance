import type { Metadata } from "next";
import { AddPasskeyButton } from "@/components/auth/add-passkey-button";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await requireAuth();
  const passkeyCount = await prisma.passkey.count({ where: { userId: user.id } });

  return (
    <>
      <PageHeader title="Dashboard" description="La vue d'ensemble arrivera dans un prochain lot." />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Votre session</CardTitle>
            <CardDescription>Compte actuellement connecté.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate font-medium" title={user.email}>
                {user.email}
              </dd>
              <dt className="text-muted-foreground">Rôle</dt>
              <dd>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              {passkeyCount === 0
                ? "Aucune passkey enregistrée. Ajoutez-en une pour vous connecter sans OAuth."
                : `Passkeys enregistrées : ${passkeyCount}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPasskeyButton />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
