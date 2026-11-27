import "server-only";
import type { Role } from "@/lib/auth/roles";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/validations/email";

export function isAdminEmail(email: string): boolean {
  return normalizeEmail(email) === getEnv().ADMIN_EMAIL;
}

export function roleForEmail(email: string): Role {
  return isAdminEmail(email) ? "ADMIN" : "USER";
}

/** Inscription fermée : seuls l'administrateur et la liste blanche passent. */
export async function isEmailAllowed(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true;

  const entry = await prisma.allowedEmail.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });
  return entry !== null;
}
