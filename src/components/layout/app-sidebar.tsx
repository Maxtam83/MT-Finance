"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Brand } from "@/components/layout/brand";
import { getNavItems, isActivePath } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

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
        {getNavItems(isAdmin).map(({ href, label, icon: Icon }) => {
          const isActive = isActivePath(pathname, href);
          return (
            <Link
              key={href}
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
        })}
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
