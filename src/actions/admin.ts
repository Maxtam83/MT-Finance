"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/action-state";
import { validationFailure } from "@/actions/validation-failure";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/auth/whitelist";
import { cancelRequestsInvolving } from "@/lib/joint-accounts/service";
import { prisma } from "@/lib/prisma";
import { addAllowedEmailSchema, removeAllowedEmailSchema } from "@/lib/validations/admin";

// Chaque action est une route publique : `requireAdmin` y est toujours appelé
// en premier, avant toute lecture de données. L'administrateur gère uniquement
// la liste blanche : il n'a aucun pouvoir sur les comptes ni sur leur partage.

const ADMIN_PATH = "/admin";

/** Construit un résultat d'échec. */
function failure(message: string): ActionState {
  return { status: "error", message };
}

/** Construit un résultat de réussite. */
function success(message: string): ActionState {
  return { status: "success", message };
}

/** Indique une violation de contrainte d'unicité signalée par Prisma. */
function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Autorise une nouvelle adresse à se connecter. */
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

/** Retire une adresse : ses sessions et ses demandes en attente sont fermées. */
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

  await prisma.$transaction([
    prisma.allowedEmail.delete({ where: { id: entry.id }, select: { id: true } }),
    prisma.session.deleteMany({ where: { user: { email: entry.email } } }),
    cancelRequestsInvolving(entry.email),
  ]);

  revalidatePath(ADMIN_PATH);
  return success(`Accès retiré pour ${entry.email}.`);
}
