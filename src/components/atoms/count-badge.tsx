import { cn } from "@/lib/utils";

const MAX_DISPLAYED = 9;

/**
 * Pastille numérique. Décorative : l'élément qui la porte annonce le nombre
 * dans son nom accessible.
 */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-semibold text-primary-foreground shadow-glow",
        className,
      )}
    >
      {count > MAX_DISPLAYED ? `${MAX_DISPLAYED}+` : count}
    </span>
  );
}
