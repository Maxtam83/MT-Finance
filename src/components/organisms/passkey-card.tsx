import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { AddPasskeyButton } from "@/components/molecules/add-passkey-button";

/** État des passkeys de la personne connectée et ajout d'une nouvelle. */
export function PasskeyCard({ passkeyCount }: { passkeyCount: number }) {
  return (
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
  );
}
