"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionState } from "@/actions/action-state";
import { initialActionState } from "@/actions/action-state";
import { Button } from "@/components/atoms/button";
import { FormMessage } from "@/components/atoms/form-message";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

/** Enregistre une passkey pour la personne connectée. */
export function AddPasskeyButton() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<ActionState>(initialActionState);
  const [isPending, setIsPending] = useState(false);

  /** Lance l'enregistrement auprès du navigateur et affiche le résultat. */
  async function addPasskey() {
    setIsPending(true);
    setFeedback(initialActionState);
    const result = await authClient.passkey.addPasskey();
    setIsPending(false);

    if (result.error) {
      const code = "code" in result.error ? String(result.error.code) : undefined;
      setFeedback({ status: "error", message: getAuthErrorMessage(code) });
      return;
    }
    setFeedback({ status: "success", message: "Passkey ajoutée." });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="outline" size="lg" disabled={isPending} onClick={addPasskey}>
        <KeyRound />
        Ajouter une passkey
      </Button>
      <FormMessage state={feedback} />
    </div>
  );
}
