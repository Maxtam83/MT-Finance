"use client";

import { CircleAlert, KeyRound, LogIn } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export type OAuthProvider = "github" | "google";

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  github: "Continuer avec GitHub",
  google: "Continuer avec Google",
};

interface SignInPanelProps {
  providers: OAuthProvider[];
  initialError: string | null;
}

export function SignInPanel({ providers, initialError }: SignInPanelProps) {
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isPending, setIsPending] = useState(false);

  async function signInWithProvider(provider: OAuthProvider) {
    setIsPending(true);
    setErrorMessage(null);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    // En cas de succès, le navigateur est redirigé vers le fournisseur.
    if (error) {
      setErrorMessage(getAuthErrorMessage(error.code));
      setIsPending(false);
    }
  }

  async function signInWithPasskey() {
    setIsPending(true);
    setErrorMessage(null);
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      const code = "code" in result.error ? String(result.error.code) : undefined;
      setErrorMessage(getAuthErrorMessage(code));
      setIsPending(false);
      return;
    }
    // Rechargement complet voulu : la page repart avec la nouvelle session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMessage ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {providers.map((provider) => (
        <Button
          key={provider}
          size="lg"
          className="h-11"
          disabled={isPending}
          onClick={() => signInWithProvider(provider)}
        >
          <LogIn />
          {PROVIDER_LABELS[provider]}
        </Button>
      ))}

      <Button
        size="lg"
        variant="outline"
        className="h-11"
        disabled={isPending}
        onClick={signInWithPasskey}
      >
        <KeyRound />
        Se connecter avec une passkey
      </Button>
    </div>
  );
}
