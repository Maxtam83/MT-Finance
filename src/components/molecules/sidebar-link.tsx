import Link from "next/link";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Entrée de la navigation latérale. */
export function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
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
    </Link>
  );
}
