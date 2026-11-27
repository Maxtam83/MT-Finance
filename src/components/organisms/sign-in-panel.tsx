"use client";

import { KeyRound, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { ErrorAlert } from "@/components/molecules/error-alert";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { reloadTo } from "@/lib/browser";

export type OAuthProvider = "github" | "google";

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  github: "Continuer avec GitHub",
  google: "Continuer avec Google",
};

export interface SignInPanelProps {
  providers: OAuthProvider[];
  initialError: string | null;
}

/** Boutons de connexion OAuth et passkey, avec le message d'erreur éventuel. */
export function SignInPanel({ providers, initialError }: SignInPanelProps) {
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isPending, setIsPending] = useState(false);

  /** Redirige vers le fournisseur OAuth choisi. */
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

  /** Connecte avec une passkey déjà enregistrée. */
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
    reloadTo("/");
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

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
