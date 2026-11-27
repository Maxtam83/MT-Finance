"use client";

import { cancelJointAccountRequest } from "@/actions/joint-accounts";
import { ConfirmAction } from "@/components/molecules/confirm-action";

/** Retire une demande envoyée, après confirmation. */
export function CancelRequestButton({ requestId }: { requestId: string }) {
  return (
    <ConfirmAction
      action={cancelJointAccountRequest}
      fields={{ requestId }}
      triggerLabel="Annuler la demande"
      warning="La personne ne pourra plus l'accepter."
      confirmLabel="Confirmer l'annulation"
      confirmVariant="destructive"
      cancelLabel="Retour"
    />
  );
}
