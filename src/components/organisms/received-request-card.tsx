import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";
import { CardHeading } from "@/components/molecules/card-heading";
import { InfoList } from "@/components/molecules/info-list";
import { RequestDecision } from "@/components/molecules/request-decision";
import { getAccountTypeLabel } from "@/lib/accounts/labels";
import { formatDate } from "@/lib/format";
import type { ReceivedRequest } from "@/lib/joint-accounts/queries";

/** Demande reçue, avec tout ce qu'il faut savoir avant de valider. */
export function ReceivedRequestCard({ request }: { request: ReceivedRequest }) {
  const { id, requesterEmail, accountName, accountType, tagOwner, expiresAt } = request;

  return (
    <Card>
      <CardHeading
        icon={<Users />}
        title="Demande de compte joint"
        description={`${requesterEmail} souhaite partager un compte avec vous.`}
      />
      <CardContent className="flex flex-col gap-4">
        <InfoList
          items={[
            { term: "Compte", value: accountName },
            { term: "Type", value: getAccountTypeLabel(accountType) },
            {
              term: "Référent des tags",
              value: tagOwner === "INVITEE" ? "Vous" : requesterEmail,
            },
            { term: "Expire le", value: formatDate(expiresAt) },
          ]}
        />
        <p className="text-muted-foreground">
          En acceptant, vous accéderez à tout l&apos;historique de ce compte et à ses futures
          opérations. N&apos;acceptez que si vous connaissez cette personne.
        </p>
        <p className="text-muted-foreground">
          {tagOwner === "INVITEE"
            ? `En acceptant, vos tags s'appliqueront à ce compte. Ceux que ${requesterEmail} a posés sur ses opérations seront détachés, sans retour possible.`
            : `En acceptant, les tags de ${requesterEmail} s'appliqueront à ce compte.`}
        </p>
        <RequestDecision requestId={id} />
      </CardContent>
    </Card>
  );
}
