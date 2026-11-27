import { Users } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/atoms/alert";

/**
 * Signale les demandes de compte joint à examiner. L'application n'envoie pas
 * d'email : c'est le seul moyen d'en être informé.
 */
export function PendingRequestsNotice({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Alert className="mb-6">
      <Users />
      <AlertTitle>
        {count === 1
          ? "Une demande de compte joint attend votre validation."
          : `${count} demandes de compte joint attendent votre validation.`}
      </AlertTitle>
      <AlertDescription>
        <Link href="/comptes">Examiner dans « Comptes »</Link>
      </AlertDescription>
    </Alert>
  );
}
