import type { z } from "zod";
import type { ActionState } from "@/actions/action-state";

/** Transforme une erreur de validation en message pour le formulaire. */
export function validationFailure(error: z.ZodError): ActionState {
  return { status: "error", message: error.issues[0]?.message ?? "Saisie invalide." };
}
