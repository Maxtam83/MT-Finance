import { Brand } from "@/components/molecules/brand";
import { SignOutButton } from "@/components/molecules/sign-out-button";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

/** En-tête affiché en dessous de 768 px. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <Brand />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
