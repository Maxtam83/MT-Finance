import Link from "next/link";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Entrée de la barre de navigation mobile. */
export function BottomNavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { href, label, shortLabel, icon: Icon } = item;
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
        isActive ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden />
      <span className="max-w-full truncate px-0.5">{shortLabel}</span>
    </Link>
  );
}
