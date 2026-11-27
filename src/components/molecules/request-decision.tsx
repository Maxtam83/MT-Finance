"use client";

import { acceptJointAccountRequest, declineJointAccountRequest } from "@/actions/joint-accounts";
import { ConfirmAction } from "@/components/molecules/confirm-action";

/** Validation ou refus d'une demande reçue, chacun après confirmation. */
export function RequestDecision({ requestId }: { requestId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmAction
        action={acceptJointAccountRequest}
        fields={{ requestId }}
        triggerLabel="Accepter"
        triggerVariant="default"
        warning="Le compte deviendra un compte joint."
        confirmLabel="Valider le compte joint"
      />
      <ConfirmAction
        action={declineJointAccountRequest}
        fields={{ requestId }}
        triggerLabel="Refuser"
        warning="La demande sera définitivement refusée."
        confirmLabel="Confirmer le refus"
        confirmVariant="destructive"
      />
    </div>
  );
}
