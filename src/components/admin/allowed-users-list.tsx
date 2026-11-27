import { RemoveEmailButton } from "@/components/admin/remove-email-button";
import { Badge } from "@/components/ui/badge";

export interface AllowedUser {
  /** Identifiant dans la liste blanche ; absent pour l'administrateur. */
  allowedEmailId: string | null;
  email: string;
  isRegistered: boolean;
}

export function AllowedUsersList({ users }: { users: AllowedUser[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {users.map(({ allowedEmailId, email, isRegistered }) => (
        <li key={email} className="flex flex-wrap items-center gap-2 px-3 py-2">
          {/* Sur mobile, l'email occupe sa propre ligne pour rester lisible. */}
          <span className="w-full min-w-0 break-all sm:w-auto sm:flex-1 sm:truncate" title={email}>
            {email}
          </span>
          {allowedEmailId ? null : <Badge>Administrateur</Badge>}
          <Badge variant={isRegistered ? "secondary" : "outline"}>
            {isRegistered ? "Inscrit" : "En attente"}
          </Badge>
          {allowedEmailId ? <RemoveEmailButton id={allowedEmailId} email={email} /> : null}
        </li>
      ))}
    </ul>
  );
}
