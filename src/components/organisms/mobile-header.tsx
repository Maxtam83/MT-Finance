import { Brand } from "@/components/molecules/brand";
import { SignOutButton } from "@/components/molecules/sign-out-button";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

/** En-tête en capsule flottante, affiché en dessous de 768 px. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 px-3 pt-3 md:hidden">
      <div className="glass flex h-14 items-center justify-between rounded-full pr-2 pl-5">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
