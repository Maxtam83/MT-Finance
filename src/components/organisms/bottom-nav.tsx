"use client";

import { usePathname } from "next/navigation";
import { BottomNavLink } from "@/components/molecules/bottom-nav-link";
import { getNavBadgeCount, getNavItems, isActivePath } from "@/lib/navigation";

/** Barre de navigation basse en capsule flottante, en dessous de 768 px. */
export function BottomNav({
  isAdmin,
  pendingRequestCount,
}: {
  isAdmin: boolean;
  pendingRequestCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="glass fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 rounded-3xl p-1 shadow-card md:hidden"
    >
      <ul className="flex">
        {getNavItems(isAdmin).map((item) => (
          <li key={item.href} className="min-w-0 flex-1">
            <BottomNavLink
              item={item}
              isActive={isActivePath(pathname, item.href)}
              badgeCount={getNavBadgeCount(item.href, pendingRequestCount)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
