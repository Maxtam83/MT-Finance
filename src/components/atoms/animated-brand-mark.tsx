import { LetterM, LetterT, LogoGradient, useLogoId } from "@/components/atoms/logo-parts";
import { LETTER_M, LETTER_T, LOGO_PEN, LOGO_VIEW_BOX } from "@/lib/brand-logo";
import { cn } from "@/lib/utils";

/**
 * Logo qui se dessine (animations des classes `splash-*` dans `globals.css`) :
 * le « M » se construit, le « T » est tracé comme à la plume, puis un reflet le
 * balaie. Sans les styles, il s'affiche entier, comme le logo fixe.
 */
export function AnimatedBrandMark({ className }: { className?: string }) {
  const id = useLogoId();
  const gradientId = `${id}-gradient`;
  const glintId = `${id}-glint`;
  const penId = `${id}-pen`;
  const shapeId = `${id}-shape`;

  return (
    <svg
      data-slot="animated-brand-mark"
      aria-hidden
      viewBox={LOGO_VIEW_BOX}
      className={cn("shrink-0 overflow-visible", className)}
    >
      <defs>
        <LogoGradient id={gradientId} />
        <linearGradient id={glintId}>
          <stop stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* Le « T » n'apparaît que là où la plume est déjà passée. */}
        <mask id={penId} maskUnits="userSpaceOnUse" x="-150" y="-200" width="1300" height="1100">
          {(["stem", "bar"] as const).map((stroke) => (
            <path
              key={stroke}
              d={LOGO_PEN[stroke].d}
              strokeWidth={LOGO_PEN[stroke].width}
              stroke="#FFFFFF"
              fill="none"
              className={`splash-pen-${stroke}`}
            />
          ))}
        </mask>
        {/* Le reflet reste à l'intérieur du dessin du logo. */}
        <clipPath id={shapeId}>
          {[...Object.values(LETTER_M), ...LETTER_T.body, LETTER_T.shine, LETTER_T.shade].map((d) => (
            <path key={d} d={d} />
          ))}
        </clipPath>
      </defs>

      <LetterM
        classNames={{
          left: "splash-m-left",
          diagonal: "splash-m-diagonal",
          right: "splash-m-right",
        }}
      />
      <LetterT gradientId={gradientId} mask={`url(#${penId})`} />
      <g clipPath={`url(#${shapeId})`}>
        <g transform="skewX(-20)">
          <rect className="splash-glint" x="-420" y="-100" width="260" height="940" fill={`url(#${glintId})`} />
        </g>
      </g>
    </svg>
  );
}
