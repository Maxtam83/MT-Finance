import Link from "next/link";
import { CountBadge } from "@/components/atoms/count-badge";
import { describeNavItem } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Entrée de la barre de navigation mobile. */
export function BottomNavLink({
  item,
  isActive,
  badgeCount = 0,
}: {
  item: NavItem;
  isActive: boolean;
  badgeCount?: number;
}) {
  const { href, label, shortLabel, icon: Icon } = item;
  return (
    <Link
      href={href}
      aria-label={describeNavItem(label, badgeCount)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.7rem] font-medium transition-colors",
        isActive ? "bg-brand/10 text-brand" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {badgeCount > 0 ? (
        <CountBadge count={badgeCount} className="absolute top-0.5 left-1/2 ml-1" />
      ) : null}
      <span className="max-w-full truncate px-0.5">{shortLabel}</span>
    </Link>
  );
}
