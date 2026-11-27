"use client";

import { addAllowedEmail } from "@/actions/admin";
import { useActionForm } from "@/components/admin/use-action-form";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddEmailForm() {
  const { state, isPending, formProps } = useActionForm(addAllowedEmail);

  return (
    <form {...formProps} className="flex flex-col gap-2">
      <Label htmlFor="allowed-email">Adresse email à autoriser</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="allowed-email"
          name="email"
          type="email"
          autoComplete="off"
          placeholder="prenom@exemple.fr"
          maxLength={254}
          required
          className="h-9"
        />
        <Button type="submit" size="lg" disabled={isPending}>
          Autoriser
        </Button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}
