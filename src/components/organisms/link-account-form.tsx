"use client";

import { linkAccountMember } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { FormMessage } from "@/components/atoms/form-message";
import { FormField } from "@/components/molecules/form-field";
import { RadioOptionGroup } from "@/components/molecules/radio-option-group";
import { useActionForm } from "@/hooks/use-action-form";

const TAG_OWNER_OPTIONS = [
  { value: "CURRENT_OWNER", label: "Le propriétaire actuel du compte" },
  { value: "NEW_MEMBER", label: "La personne ajoutée" },
];

/** Liaison d'un membre à un compte par l'administrateur. */
export function LinkAccountForm() {
  const { state, isPending, formProps } = useActionForm(linkAccountMember);

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <FormField
        id="account-id"
        label="Identifiant du compte"
        name="accountId"
        spellCheck={false}
        maxLength={64}
        required
        className="h-9 font-mono"
      />
      <FormField
        id="member-email"
        label="Email d'un utilisateur inscrit"
        name="email"
        type="email"
        maxLength={254}
        required
        className="h-9"
      />
      <RadioOptionGroup
        name="tagOwner"
        legend="Référent des tags"
        options={TAG_OWNER_OPTIONS}
        defaultValue="CURRENT_OWNER"
        hint="Ses tags s'appliqueront au compte joint. Le choix est fixé à la première liaison."
      />
      <Button type="submit" size="lg" disabled={isPending} className="self-start">
        Lier au compte
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
