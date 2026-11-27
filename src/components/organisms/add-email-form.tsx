"use client";

import { addAllowedEmail } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { FormMessage } from "@/components/atoms/form-message";
import { FormField } from "@/components/molecules/form-field";
import { useActionForm } from "@/hooks/use-action-form";

/** Ajout d'une adresse à la liste blanche. */
export function AddEmailForm() {
  const { state, isPending, formProps } = useActionForm(addAllowedEmail);

  return (
    <form {...formProps} className="flex flex-col gap-2">
      <FormField
        id="allowed-email"
        label="Adresse email à autoriser"
        name="email"
        type="email"
        placeholder="prenom@exemple.fr"
        maxLength={254}
        required
        className="h-11"
        trailing={
          <Button type="submit" size="lg" disabled={isPending}>
            Autoriser
          </Button>
        }
      />
      <FormMessage state={state} />
    </form>
  );
}
