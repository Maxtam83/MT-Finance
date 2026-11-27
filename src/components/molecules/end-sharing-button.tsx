"use client";

import { leaveSharedAccount, stopAccountSharing } from "@/actions/joint-accounts";
import { ConfirmAction } from "@/components/molecules/confirm-action";

interface EndSharingButtonProps {
  accountId: string;
  isOwner: boolean;
  /** Adresse de l'autre personne. */
  sharedWith: string;
}

/** Met fin à un compte joint : arrêt par le propriétaire, ou départ de l'invité. */
export function EndSharingButton({ accountId, isOwner, sharedWith }: EndSharingButtonProps) {
  const consequences = isOwner
    ? `${sharedWith} perdra l'accès immédiatement. Ses tags seront détachés du compte et ses règles propres à ce compte supprimées.`
    : "Vous perdrez l'accès immédiatement. Vos tags seront détachés du compte et vos règles propres à ce compte supprimées.";

  return (
    <ConfirmAction
      action={isOwner ? stopAccountSharing : leaveSharedAccount}
      fields={{ accountId }}
      triggerLabel={isOwner ? "Arrêter le partage" : "Quitter le compte joint"}
      warning={consequences}
      confirmLabel={isOwner ? "Confirmer l'arrêt du partage" : "Confirmer mon départ"}
      confirmVariant="destructive"
      cancelLabel="Retour"
    />
  );
}
