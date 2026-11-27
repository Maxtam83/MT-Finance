import "server-only";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { ACCESS_ERROR, ACCESS_ERROR_MESSAGES } from "@/lib/auth/errors";
import { isEmailAllowed, roleForEmail } from "@/lib/auth/whitelist";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/validations/email";

const APP_NAME = "MT Finance";

const env = getEnv();
const appUrl = new URL(env.BETTER_AUTH_URL);

type AccessError = (typeof ACCESS_ERROR)[keyof typeof ACCESS_ERROR];

/** Interrompt l'opération avec un code d'accès refusé. */
function denyAccess(code: AccessError): never {
  // Le `code` est repris dans l'URL de retour OAuth : /login?error=<code>
  throw new APIError("FORBIDDEN", { code, message: ACCESS_ERROR_MESSAGES[code] });
}

/** Exige une adresse autorisée et vérifiée par le fournisseur. */
async function assertAccessAllowed(user: { email: string; emailVerified: boolean }): Promise<void> {
  if (!(await isEmailAllowed(user.email))) denyAccess(ACCESS_ERROR.emailNotAllowed);
  // Le rôle ADMIN dépend de l'email : il doit être prouvé par le fournisseur.
  if (!user.emailVerified) denyAccess(ACCESS_ERROR.emailUnverified);
}

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: appUrl.origin,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "sqlite" }),

  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {}),
  },

  user: {
    additionalFields: {
      // `input: false` : un utilisateur ne peut jamais choisir son rôle.
      role: { type: "string", required: false, defaultValue: "USER", input: false },
    },
  },
  // "Account" désigne les comptes bancaires : la table OAuth est renommée.
  account: { modelName: "authAccount", encryptOAuthTokens: true },
  onAPIError: { errorURL: `${appUrl.origin}/login` },

  databaseHooks: {
    // 1. Création de compte : refusée hors liste blanche, rôle attribué ici.
    user: {
      create: {
        before: async (user) => {
          const email = normalizeEmail(user.email);
          await assertAccessAllowed({ email, emailVerified: user.emailVerified });
          return { data: { ...user, email, role: roleForEmail(email) } };
        },
      },
    },
    // 2. Chaque connexion (OAuth ou passkey) revérifie l'accès et le rôle.
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true, emailVerified: true, role: true },
          });
          if (!user) denyAccess(ACCESS_ERROR.emailNotAllowed);
          await assertAccessAllowed(user);

          const role = roleForEmail(user.email);
          if (user.role !== role) {
            await prisma.user.update({
              where: { id: session.userId },
              data: { role },
              select: { id: true },
            });
          }
        },
      },
    },
  },

  plugins: [
    passkey({ rpID: appUrl.hostname, rpName: APP_NAME, origin: appUrl.origin }),
    // Doit rester le dernier : transmet les cookies depuis les Server Actions.
    nextCookies(),
  ],
});
