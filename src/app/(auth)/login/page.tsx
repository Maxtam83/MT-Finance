import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import type { OAuthProvider } from "@/components/auth/sign-in-panel";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getAuthSession } from "@/lib/auth/guards";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Connexion" };

interface LoginPageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getAuthSession()) redirect("/");

  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;

  const env = getEnv();
  const providers: OAuthProvider[] = [];
  if (env.GITHUB_CLIENT_ID) providers.push("github");
  if (env.GOOGLE_CLIENT_ID) providers.push("google");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <Brand />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>
            <h1 className="text-lg">Connexion</h1>
          </CardTitle>
          <CardDescription>Accès réservé aux personnes autorisées.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInPanel
            providers={providers}
            initialError={errorCode ? getAuthErrorMessage(errorCode) : null}
          />
        </CardContent>
      </Card>
    </main>
  );
}
