import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";
import { AddPasskeyButton } from "@/components/molecules/add-passkey-button";
import { CardHeading } from "@/components/molecules/card-heading";

/** État des passkeys de la personne connectée et ajout d'une nouvelle. */
export function PasskeyCard({ passkeyCount }: { passkeyCount: number }) {
  return (
    <Card>
      <CardHeading
        icon={<KeyRound />}
        title="Passkeys"
        description={
          passkeyCount === 0
            ? "Aucune passkey enregistrée. Ajoutez-en une pour vous connecter sans OAuth."
            : `Passkeys enregistrées : ${passkeyCount}.`
        }
      />
      <CardContent>
        <AddPasskeyButton />
      </CardContent>
    </Card>
  );
}
