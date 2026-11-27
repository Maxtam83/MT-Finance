import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { requireAuth } from "@/lib/auth/guards";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-dvh">
      <AppSidebar isAdmin={isAdmin} email={user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-10">
          {children}
        </main>
      </div>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
