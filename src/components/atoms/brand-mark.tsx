import { LetterM, LetterT, LogoGradient, useLogoId } from "@/components/atoms/logo-parts";
import { LOGO_VIEW_BOX } from "@/lib/brand-logo";
import { cn } from "@/lib/utils";

/** Logo « MT » de la marque. Décoratif : son nom est écrit ou annoncé à côté. */
export function BrandMark({ className }: { className?: string }) {
  const gradientId = `${useLogoId()}-gradient`;

  return (
    <svg
      data-slot="brand-mark"
      aria-hidden
      viewBox={LOGO_VIEW_BOX}
      className={cn("h-7 w-auto shrink-0 overflow-visible", className)}
    >
      <defs>
        <LogoGradient id={gradientId} />
      </defs>
      <LetterM />
      <LetterT gradientId={gradientId} />
    </svg>
  );
}
