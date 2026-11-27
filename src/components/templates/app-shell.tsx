import type { ReactNode } from "react";
import { HaloBackground } from "@/components/atoms/halo-background";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import { BottomNav } from "@/components/organisms/bottom-nav";
import { MobileHeader } from "@/components/organisms/mobile-header";

interface AppShellProps {
  isAdmin: boolean;
  email: string;
  children: ReactNode;
}

/** Structure des pages protégées : navigation latérale ou basse selon l'écran. */
export function AppShell({ isAdmin, email, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <HaloBackground />
      <AppSidebar isAdmin={isAdmin} email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-12">
          {children}
        </main>
      </div>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
