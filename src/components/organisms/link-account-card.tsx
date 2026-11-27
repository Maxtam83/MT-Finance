import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { LinkAccountForm } from "@/components/organisms/link-account-form";

/** Liaison d'un membre à un compte, réservée à l'administration. */
export function LinkAccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compte joint (accès à l&apos;aveugle)</CardTitle>
        <CardDescription>
          Ajoute un membre à un compte sans afficher son nom ni ses données. L&apos;identifiant est à
          demander à son propriétaire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LinkAccountForm />
      </CardContent>
    </Card>
  );
}
