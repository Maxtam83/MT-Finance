"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { ActionState } from "@/actions/action-state";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/auth/whitelist";
import { prisma } from "@/lib/prisma";
import {
  addAllowedEmailSchema,
  linkAccountMemberSchema,
  removeAllowedEmailSchema,
} from "@/lib/validations/admin";

// Chaque action est une route publique : `requireAdmin` y est toujours appelé
// en premier, avant toute lecture de données.

const ADMIN_PATH = "/admin";

function failure(message: string): ActionState {
  return { status: "error", message };
}

function success(message: string): ActionState {
  return { status: "success", message };
}

function validationFailure(error: z.ZodError): ActionState {
  return failure(error.issues[0]?.message ?? "Saisie invalide.");
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function addAllowedEmail(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user: admin } = await requireAdmin();

  const parsed = addAllowedEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { email } = parsed.data;

  if (isAdminEmail(email)) return failure("L'administrateur est toujours autorisé.");

  try {
    await prisma.allowedEmail.create({
      data: { email, addedBy: admin.id },
      select: { id: true },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return failure("Cet email est déjà autorisé.");
    throw error;
  }

  revalidatePath(ADMIN_PATH);
  return success(`${email} peut désormais se connecter.`);
}

export async function removeAllowedEmail(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = removeAllowedEmailSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return validationFailure(parsed.error);

  const entry = await prisma.allowedEmail.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, email: true },
  });
  if (!entry) return failure("Cet accès n'existe plus.");

  // Retrait et fermeture des sessions ouvertes, ensemble.
  await prisma.$transaction([
    prisma.allowedEmail.delete({ where: { id: entry.id }, select: { id: true } }),
    prisma.session.deleteMany({ where: { user: { email: entry.email } } }),
  ]);

  revalidatePath(ADMIN_PATH);
  return success(`Accès retiré pour ${entry.email}.`);
}

/**
 * Liaison « à l'aveugle » : ne sélectionne que des identifiants. Aucune donnée
 * financière ni nom de compte n'est lu, et seule une confirmation est renvoyée.
 */
export async function linkAccountMember(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = linkAccountMemberSchema.safeParse({
    accountId: formData.get("accountId"),
    email: formData.get("email"),
    tagOwner: formData.get("tagOwner"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { accountId, email, tagOwner } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return failure("Aucun utilisateur inscrit avec cet email.");

  try {
    const outcome = await prisma.$transaction(async (transaction): Promise<ActionState> => {
      const account = await transaction.account.findUnique({
        where: { id: accountId },
        select: { tagOwnerId: true, members: { select: { userId: true, role: true } } },
      });
      if (!account) return failure("Aucun compte ne correspond à cet identifiant.");
      if (account.members.some((member) => member.userId === user.id)) {
        return failure("Cet utilisateur est déjà membre de ce compte.");
      }

      // Le référent des tags est fixé à la première liaison, puis conservé.
      let newTagOwnerId: string | undefined;
      if (!account.tagOwnerId) {
        newTagOwnerId =
          tagOwner === "NEW_MEMBER"
            ? user.id
            : account.members.find((member) => member.role === "OWNER")?.userId;
        if (!newTagOwnerId) {
          return failure("Ce compte n'a pas de propriétaire à désigner comme référent.");
        }
      }

      await transaction.accountMember.create({
        data: { accountId, userId: user.id, role: "MEMBER" },
        select: { id: true },
      });

      if (newTagOwnerId) {
        // `updateMany` ne renvoie qu'un nombre : aucun champ du compte n'est lu.
        await transaction.account.updateMany({
          where: { id: accountId, tagOwnerId: null },
          data: { tagOwnerId: newTagOwnerId },
        });
        return success("Liaison enregistrée.");
      }
      return success("Liaison enregistrée. Le référent des tags déjà défini est conservé.");
    });

    return outcome;
  } catch (error) {
    if (isUniqueViolation(error)) return failure("Cet utilisateur est déjà membre de ce compte.");
    throw error;
  }
}
