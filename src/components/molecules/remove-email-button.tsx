"use client";

import { Trash2 } from "lucide-react";
import { removeAllowedEmail } from "@/actions/admin";
import { ConfirmAction } from "@/components/molecules/confirm-action";

/** Retrait d'une adresse de la liste blanche, après confirmation. */
export function RemoveEmailButton({ id, email }: { id: string; email: string }) {
  return (
    <ConfirmAction
      action={removeAllowedEmail}
      fields={{ id }}
      triggerLabel={`Retirer l'accès de ${email}`}
      triggerIcon={<Trash2 />}
      triggerVariant="ghost"
      warning="Ses sessions seront fermées."
      confirmLabel="Retirer l'accès"
      confirmVariant="destructive"
    />
  );
}
