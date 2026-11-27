"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/action-state";
import { validationFailure } from "@/actions/validation-failure";
import { requireAuth } from "@/lib/auth/guards";
import {
  acceptJointRequest,
  cancelJointRequest,
  createJointRequest,
  declineJointRequest,
} from "@/lib/joint-accounts/service";
import type { Actor } from "@/lib/joint-accounts/service";
import { jointRequestIdSchema, requestJointAccountSchema } from "@/lib/validations/joint-account";

// Chaque action est une route publique : `requireAuth` y est toujours appelé en
// premier, et l'identité de la personne vient uniquement de sa session.

/** Rafraîchit les pages qui affichent les comptes et les demandes. */
function refreshAccountPages(): void {
  revalidatePath("/comptes");
  revalidatePath("/");
}

/** Le propriétaire propose de transformer son compte en compte joint. */
export async function requestJointAccount(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireAuth();

  const parsed = requestJointAccountSchema.safeParse({
    accountId: formData.get("accountId"),
    inviteeEmail: formData.get("inviteeEmail"),
    tagOwner: formData.get("tagOwner"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { accountId, inviteeEmail, tagOwner } = parsed.data;

  const result = await createJointRequest(user, { accountId, inviteeEmail, tagOwner });
  refreshAccountPages();
  return result;
}

/** Applique à une demande désignée par le formulaire la décision de la personne connectée. */
async function resolveRequest(
  formData: FormData,
  resolve: (actor: Actor, requestId: string) => Promise<ActionState>,
): Promise<ActionState> {
  const { user } = await requireAuth();

  const parsed = jointRequestIdSchema.safeParse({ requestId: formData.get("requestId") });
  if (!parsed.success) return validationFailure(parsed.error);

  const result = await resolve(user, parsed.data.requestId);
  refreshAccountPages();
  return result;
}

/** La personne invitée valide : le compte devient joint. */
export async function acceptJointAccountRequest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return resolveRequest(formData, acceptJointRequest);
}

/** La personne invitée refuse. */
export async function declineJointAccountRequest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return resolveRequest(formData, declineJointRequest);
}

/** La personne qui a envoyé la demande la retire. */
export async function cancelJointAccountRequest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return resolveRequest(formData, cancelJointRequest);
}
