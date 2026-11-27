import { AllowedUserRow } from "@/components/molecules/allowed-user-row";
import type { AllowedUser } from "@/components/molecules/allowed-user-row";

/** Liste des personnes autorisées à se connecter. */
export function AllowedUsersList({ users }: { users: readonly AllowedUser[] }) {
  return (
    <ul className="divide-y divide-glass-border overflow-hidden rounded-2xl border border-glass-border bg-field">
      {users.map((user) => (
        <AllowedUserRow key={user.email} {...user} />
      ))}
    </ul>
  );
}
