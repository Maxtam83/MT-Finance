"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { initialActionState } from "@/actions/action-state";
import type { ActionState } from "@/actions/action-state";

type FormAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * React vide un formulaire après chaque action, même en échec. Ici la saisie est
 * conservée en cas d'erreur et effacée seulement après un succès.
 */
export function useActionForm(action: FormAction) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  // `action` reste défini : avant l'hydratation, le navigateur envoie en POST
  // et aucune saisie ne finit dans l'URL.
  return { state, isPending, formProps: { ref: formRef, action: formAction, onSubmit } };
}
