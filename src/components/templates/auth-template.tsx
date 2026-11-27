import type { ReactNode } from "react";
import { BrandMark } from "@/components/atoms/brand-mark";
import { HaloBackground } from "@/components/atoms/halo-background";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

/** Structure centrée des pages accessibles sans connexion, avec le grand titre. */
export function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-14">
      <HaloBackground />
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>

      <div className="flex max-w-xl flex-col items-center gap-5 text-center">
        <BrandMark />
        <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
          MT <span className="text-gradient">Finance</span>
        </h1>
        <p className="text-lg text-muted-foreground md:text-xl">
          Vos finances personnelles et votre patrimoine, au même endroit.
        </p>
      </div>

      {children}
    </main>
  );
}
