"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { initialActionState } from "@/actions/action-state";
import { removeAllowedEmail } from "@/actions/admin";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";

export function RemoveEmailButton({ id, email }: { id: string; email: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(removeAllowedEmail, initialActionState);

  if (!isConfirming) {
    return (
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Retirer l'accès de ${email}`}
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 />
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-muted-foreground">Ses sessions seront fermées.</span>
      <Button type="submit" variant="destructive" disabled={isPending}>
        Retirer l&apos;accès
      </Button>
      <Button type="button" variant="ghost" onClick={() => setIsConfirming(false)}>
        Annuler
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}
