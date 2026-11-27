"use client";

import { usePathname } from "next/navigation";
import { Brand } from "@/components/molecules/brand";
import { SidebarLink } from "@/components/molecules/sidebar-link";
import { SignOutButton } from "@/components/molecules/sign-out-button";
import { ThemeToggle } from "@/components/molecules/theme-toggle";
import { getNavItems, isActivePath } from "@/lib/navigation";

interface AppSidebarProps {
  isAdmin: boolean;
  email: string;
}

/** Navigation latérale, à partir de 768 px. */
export function AppSidebar({ isAdmin, email }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
      <div className="px-2 py-2">
        <Brand />
      </div>

      <nav aria-label="Navigation principale" className="mt-6 flex flex-1 flex-col gap-1">
        {getNavItems(isAdmin).map((item) => (
          <SidebarLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border pt-3">
        <p className="truncate px-2 text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <SignOutButton showLabel />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
