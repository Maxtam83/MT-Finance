import type { ActionState } from "@/actions/action-state";
import { cn } from "@/lib/utils";

/** La région reste dans la page pour que les lecteurs d'écran annoncent le message. */
export function FormFeedback({ state }: { state: ActionState }) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "text-sm empty:hidden",
        state.status === "error" ? "text-destructive" : "text-primary",
      )}
    >
      {state.status === "idle" ? null : state.message}
    </p>
  );
}
