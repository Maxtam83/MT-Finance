import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/atoms/alert";

/** Message d'erreur mis en évidence. */
export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
