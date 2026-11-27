import { useId } from "react";
import { LETTER_M, LETTER_T, LOGO_COLORS, LOGO_GRADIENT_AXIS } from "@/lib/brand-logo";

/**
 * Identifiant propre à un exemplaire du logo. Sans cela, un dégradé défini dans
 * un logo masqué ne serait pas appliqué aux logos visibles qui le réutilisent.
 */
export function useLogoId(): string {
  return `logo-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
}

/** Dégradé du « T ». À placer dans `<defs>`. */
export function LogoGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} {...LOGO_GRADIENT_AXIS} gradientUnits="userSpaceOnUse">
      <stop stopColor={LOGO_COLORS.gradientStart} />
      <stop offset="1" stopColor={LOGO_COLORS.gradientEnd} />
    </linearGradient>
  );
}

/** Les trois traits du « M » ; `classNames` permet de les animer séparément. */
export function LetterM({ classNames }: { classNames?: Partial<Record<keyof typeof LETTER_M, string>> }) {
  return (
    <g data-letter="m" fill={LOGO_COLORS.slate}>
      <path d={LETTER_M.left} className={classNames?.left} />
      <path d={LETTER_M.diagonal} className={classNames?.diagonal} />
      <path d={LETTER_M.right} className={classNames?.right} />
    </g>
  );
}

/** Le « T », avec son voile en dégradé. */
export function LetterT({ gradientId, mask }: { gradientId: string; mask?: string }) {
  return (
    <g data-letter="t" mask={mask}>
      {LETTER_T.body.map((d) => (
        <path key={d} d={d} fill={LOGO_COLORS.blue} />
      ))}
      <path d={LETTER_T.shine} fill={`url(#${gradientId})`} opacity="0.66" />
      <path d={LETTER_T.shade} fill={LOGO_COLORS.slate} />
    </g>
  );
}
