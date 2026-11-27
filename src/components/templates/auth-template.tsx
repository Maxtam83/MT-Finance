import type { ReactNode } from "react";
import { Brand } from "@/components/molecules/brand";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

/** Structure centrée des pages accessibles sans connexion. */
export function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <Brand />
      {children}
    </main>
  );
}
