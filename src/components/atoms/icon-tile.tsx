import type { ReactNode } from "react";

/** Pastille carrée qui met une icône en valeur. Décorative. */
export function IconTile({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand [&_svg]:size-5"
    >
      {children}
    </span>
  );
}
