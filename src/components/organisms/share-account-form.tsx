"use client";

import { requestJointAccount } from "@/actions/joint-accounts";
import { Button } from "@/components/atoms/button";
import { FormMessage } from "@/components/atoms/form-message";
import { ConsentCheckbox } from "@/components/molecules/consent-checkbox";
import { FormField } from "@/components/molecules/form-field";
import { RadioOptionGroup } from "@/components/molecules/radio-option-group";
import { useActionForm } from "@/hooks/use-action-form";
import type { TagOwnerChoice } from "@/lib/joint-accounts/constants";

const TAG_OWNER_OPTIONS: readonly { value: TagOwnerChoice; label: string }[] = [
  { value: "REQUESTER", label: "Moi" },
  { value: "INVITEE", label: "La personne invitée" },
];

/** Demande de transformation d'un compte en compte joint. */
export function ShareAccountForm({ accountId }: { accountId: string }) {
  const { state, isPending, formProps } = useActionForm(requestJointAccount);

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="accountId" value={accountId} />
      <FormField
        id={`invitee-${accountId}`}
        label="Adresse email de l'autre personne"
        name="inviteeEmail"
        type="email"
        maxLength={254}
        required
      />
      <RadioOptionGroup
        name="tagOwner"
        legend="Référent des tags"
        options={TAG_OWNER_OPTIONS}
        defaultValue="REQUESTER"
        hint="Les tags de cette personne s'appliqueront au compte joint. Si vous désignez la personne invitée, vos tags seront détachés des opérations de ce compte à sa validation, sans retour possible."
      />
      <ConsentCheckbox
        name="consent"
        label="J'accepte que cette personne accède à tout l'historique de ce compte et à ses futures opérations."
      />
      <Button type="submit" size="lg" disabled={isPending} className="self-start">
        Envoyer la demande
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
