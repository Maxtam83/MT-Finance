import { UserRound } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Card, CardContent } from "@/components/atoms/card";
import { CardHeading } from "@/components/molecules/card-heading";
import { InfoList } from "@/components/molecules/info-list";
import type { Role } from "@/lib/auth/roles";

/** Rappel du compte connecté et de son rôle. */
export function SessionCard({ email, role }: { email: string; role: Role }) {
  return (
    <Card>
      <CardHeading
        icon={<UserRound />}
        title="Votre session"
        description="Compte actuellement connecté."
      />
      <CardContent>
        <InfoList
          items={[
            { term: "Email", value: <span title={email}>{email}</span> },
            {
              term: "Rôle",
              value: <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
