import Link from "next/link";
import { CountBadge } from "@/components/atoms/count-badge";
import { describeNavItem } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Entrée de la navigation latérale. */
export function SidebarLink({
  item,
  isActive,
  badgeCount = 0,
}: {
  item: NavItem;
  isActive: boolean;
  badgeCount?: number;
}) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      aria-label={describeNavItem(label, badgeCount)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "border-brand/20 bg-brand/10 text-brand"
          : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
      {badgeCount > 0 ? <CountBadge count={badgeCount} className="ml-auto" /> : null}
    </Link>
  );
}
