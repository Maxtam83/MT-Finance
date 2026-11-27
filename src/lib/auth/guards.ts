import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/lib/auth/roles";
import { auth } from "@/lib/auth/server";
import { isAdminEmail, isEmailAllowed } from "@/lib/auth/whitelist";
import { prisma } from "@/lib/prisma";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  };
}

/**
 * Session de la requête en cours, ou `null`. L'utilisateur et la liste blanche
 * sont relus en base : un retrait d'accès prend effet immédiatement.
 * `cache` évite de répéter ces requêtes pendant un même rendu.
 */
export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, emailVerified: true },
  });
  if (!user || !user.emailVerified || !(await isEmailAllowed(user.email))) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === "ADMIN" && isAdminEmail(user.email) ? "ADMIN" : "USER",
    },
  };
});

/**
 * À appeler dans chaque page et Server Action protégée : un layout n'est pas
 * réexécuté à chaque navigation et ne suffit pas à protéger les données.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}
