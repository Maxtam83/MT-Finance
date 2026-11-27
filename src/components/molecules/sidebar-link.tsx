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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
