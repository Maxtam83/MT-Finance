import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { SignInPanel } from "@/components/organisms/sign-in-panel";
import type { SignInPanelProps } from "@/components/organisms/sign-in-panel";

/** Carte de connexion. */
export function LoginCard(props: SignInPanelProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>
          <h2>Connexion</h2>
        </CardTitle>
        <CardDescription>Accès réservé aux personnes autorisées.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInPanel {...props} />
      </CardContent>
    </Card>
  );
}
