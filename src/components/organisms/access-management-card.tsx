import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import type { AllowedUser } from "@/components/molecules/allowed-user-row";
import { AddEmailForm } from "@/components/organisms/add-email-form";
import { AllowedUsersList } from "@/components/organisms/allowed-users-list";

/** Gestion de la liste blanche. */
export function AccessManagementCard({ users }: { users: readonly AllowedUser[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des accès</CardTitle>
        <CardDescription>Seules ces adresses peuvent se connecter.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddEmailForm />
        <AllowedUsersList users={users} />
      </CardContent>
    </Card>
  );
}
