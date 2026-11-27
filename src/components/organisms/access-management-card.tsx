import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";
import type { AllowedUser } from "@/components/molecules/allowed-user-row";
import { CardHeading } from "@/components/molecules/card-heading";
import { AddEmailForm } from "@/components/organisms/add-email-form";
import { AllowedUsersList } from "@/components/organisms/allowed-users-list";

/** Gestion de la liste blanche. */
export function AccessManagementCard({ users }: { users: readonly AllowedUser[] }) {
  return (
    <Card>
      <CardHeading
        icon={<ShieldCheck />}
        title="Gestion des accès"
        description="Seules ces adresses peuvent se connecter."
      />
      <CardContent className="flex flex-col gap-4">
        <AddEmailForm />
        <AllowedUsersList users={users} />
      </CardContent>
    </Card>
  );
}
