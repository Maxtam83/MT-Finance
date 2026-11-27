"use client";

import { useActionState, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { initialActionState } from "@/actions/action-state";
import type { ActionState } from "@/actions/action-state";
import { Button } from "@/components/atoms/button";
import { FormMessage } from "@/components/atoms/form-message";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

export interface ConfirmActionProps {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  /** Champs cachés envoyés à l'action. */
  fields: Readonly<Record<string, string>>;
  /** Texte du premier bouton, ou nom accessible s'il n'affiche qu'une icône. */
  triggerLabel: string;
  triggerIcon?: ReactNode;
  triggerVariant?: ButtonVariant;
  /** Conséquence rappelée avant la confirmation. */
  warning: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  /** Texte du bouton qui renonce à l'action. */
  cancelLabel?: string;
}

/** Action en deux temps : rien n'est envoyé sans une confirmation explicite. */
export function ConfirmAction({
  action,
  fields,
  triggerLabel,
  triggerIcon,
  triggerVariant = "outline",
  warning,
  confirmLabel,
  confirmVariant = "default",
  cancelLabel = "Annuler",
}: ConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerIcon ? "icon-lg" : "lg"}
        aria-label={triggerIcon ? triggerLabel : undefined}
        onClick={() => setIsConfirming(true)}
      >
        {triggerIcon ?? triggerLabel}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-wrap items-center justify-end gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="text-xs text-muted-foreground">{warning}</span>
      <Button type="submit" size="lg" variant={confirmVariant} disabled={isPending}>
        {confirmLabel}
      </Button>
      <Button type="button" size="lg" variant="ghost" onClick={() => setIsConfirming(false)}>
        {cancelLabel}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
