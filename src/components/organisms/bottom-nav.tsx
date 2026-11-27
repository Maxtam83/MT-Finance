"use client";

import { usePathname } from "next/navigation";
import { BottomNavLink } from "@/components/molecules/bottom-nav-link";
import { getNavItems, isActivePath } from "@/lib/navigation";

/** Barre de navigation basse, en dessous de 768 px. */
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {getNavItems(isAdmin).map((item) => (
          <li key={item.href} className="min-w-0 flex-1">
            <BottomNavLink item={item} isActive={isActivePath(pathname, item.href)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
