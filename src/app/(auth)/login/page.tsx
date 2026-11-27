import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginCard } from "@/components/organisms/login-card";
import type { OAuthProvider } from "@/components/organisms/sign-in-panel";
import { AuthTemplate } from "@/components/templates/auth-template";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getAuthSession } from "@/lib/auth/guards";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Connexion" };

interface LoginPageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

/** Page de connexion ; affiche le motif d'un refus passé dans l'URL. */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getAuthSession()) redirect("/");

  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;

  const env = getEnv();
  const providers: OAuthProvider[] = [];
  if (env.GITHUB_CLIENT_ID) providers.push("github");
  if (env.GOOGLE_CLIENT_ID) providers.push("google");

  return (
    <AuthTemplate>
      <LoginCard
        providers={providers}
        initialError={errorCode ? getAuthErrorMessage(errorCode) : null}
      />
    </AuthTemplate>
  );
}
