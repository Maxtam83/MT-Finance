import { Users, Wallet } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Card, CardContent } from "@/components/atoms/card";
import { CancelRequestButton } from "@/components/molecules/cancel-request-button";
import { CardHeading } from "@/components/molecules/card-heading";
import { InfoList } from "@/components/molecules/info-list";
import { ShareAccountForm } from "@/components/organisms/share-account-form";
import { getAccountTypeLabel } from "@/lib/accounts/labels";
import { formatDate } from "@/lib/format";
import type { AccountSummary } from "@/lib/joint-accounts/queries";

/** Un compte et son état de partage. */
export function AccountCard({ account }: { account: AccountSummary }) {
  const { id, name, type, isOwner, joint, pendingRequest } = account;

  return (
    <Card>
      <CardHeading
        icon={joint ? <Users /> : <Wallet />}
        title={name}
        description={getAccountTypeLabel(type)}
      />
      <CardContent className="flex flex-col items-start gap-4">
        {joint ? (
          <>
            <Badge>Compte joint</Badge>
            <InfoList
              items={[
                { term: "Partagé avec", value: joint.sharedWith },
                { term: "Référent des tags", value: joint.tagOwner },
              ]}
            />
          </>
        ) : pendingRequest ? (
          <>
            <Badge variant="outline">En attente de validation</Badge>
            <p className="text-muted-foreground">
              Demande envoyée à {pendingRequest.inviteeEmail}. Le compte ne sera partagé qu&apos;après
              sa validation. Elle expire le {formatDate(pendingRequest.expiresAt)}.
            </p>
            <CancelRequestButton requestId={pendingRequest.id} />
          </>
        ) : isOwner ? (
          <details className="w-full">
            <summary className="cursor-pointer font-medium text-brand">
              Transformer en compte joint
            </summary>
            <div className="mt-4">
              <ShareAccountForm accountId={id} />
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
