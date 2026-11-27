import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { InfoList } from "@/components/molecules/info-list";
import type { Role } from "@/lib/auth/roles";

/** Rappel du compte connecté et de son rôle. */
export function SessionCard({ email, role }: { email: string; role: Role }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre session</CardTitle>
        <CardDescription>Compte actuellement connecté.</CardDescription>
      </CardHeader>
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
