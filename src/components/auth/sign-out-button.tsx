"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({ showLabel = false }: { showLabel?: boolean }) {
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    const { error } = await authClient.signOut();
    if (error) {
      setIsPending(false);
      return;
    }
    // Rechargement complet voulu : il vide le cache de navigation côté client.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "lg" : "icon-lg"}
      aria-label={showLabel ? undefined : "Se déconnecter"}
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut />
      {showLabel ? "Se déconnecter" : null}
    </Button>
  );
}
