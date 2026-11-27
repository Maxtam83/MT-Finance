"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionState } from "@/actions/action-state";
import { initialActionState } from "@/actions/action-state";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export function AddPasskeyButton() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<ActionState>(initialActionState);
  const [isPending, setIsPending] = useState(false);

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
      <FormFeedback state={feedback} />
    </div>
  );
}
