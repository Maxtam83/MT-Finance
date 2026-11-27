import { useId } from "react";
import { cn } from "@/lib/utils";

const SLATE = "#37555F";
const BLUE = "#1085EC";

/** Les trois traits du « M ». */
const LETTER_M = [
  "M122 720.97H0V150.97H122V720.97Z",
  "M325.69 442.371C294.977 470.977 269.524 505.401 250.989 543.941L24.1938 220.045L122.042 151.531L325.69 442.371Z",
  "M560 401.672V720.97H682V256.278L560 401.672Z",
];

/** Corps bleu du « T » : boucle, hampe et barre. */
const LETTER_T = [
  "M400.116 564.073C383.999 582.635 374.519 610.187 376.104 640.421C378.239 681.162 399.845 714.958 428.539 727.591C387.795 740.652 345.787 736.295 314.299 711.694C257.194 667.079 256.314 572.787 312.332 501.086C313.24 499.924 314.158 498.775 315.084 497.64L400.116 564.073Z",
  "M398.814 566.037L313.423 499.322L548.865 197.97H686.379L398.814 566.037Z",
  "M965.498 0C965.83 4.12126 966 8.2792 966 12.4697C966 113.265 868.491 195.282 747 197.904V197.97H501.212C490.192 197.596 479.483 197.6 469.143 197.97H469V197.975C396.75 200.583 342.55 221.118 326.538 256.268C340.992 168.345 398.166 100.873 468.608 91.9697H635.71C644.965 92.3134 654.333 92.4902 663.799 92.4902C804.516 92.4902 923.847 53.7074 965.498 0Z",
];

/** Voile en dégradé posé sur le « T ». */
const LETTER_T_SHINE =
  "M965.498 0C965.83 4.12126 966 8.2792 966 12.4697C966 113.265 868.491 195.282 747 197.904V197.97H686.379L398.813 566.037L398.6 565.87C383.407 584.389 374.569 611.148 376.104 640.421C378.239 681.161 399.845 714.957 428.539 727.591C387.794 740.651 345.787 736.295 314.299 711.694C257.195 667.079 256.314 572.786 312.332 501.086C312.756 500.544 313.182 500.004 313.609 499.468L313.423 499.322L542.227 206.466C542.454 206.412 542.681 206.358 542.909 206.308C543.697 205.006 544.528 203.706 545.399 202.404L548.865 197.97H548.528C581.403 153.641 661.497 110.093 761.468 86.0059C857.756 72.8312 933.934 40.7013 965.498 0Z";

/** Revers ardoise de la boucle du « T ». */
const LETTER_T_SHADE =
  "M387.588 582.902C379.329 599.299 374.992 619.2 376.104 640.421C378.239 681.162 399.846 714.958 428.54 727.591C402.183 736.039 375.3 737.196 351.076 730.304C325.648 712.335 328.376 662.23 357.51 617.367C366.406 603.669 376.749 592.022 387.588 582.902Z";

/**
 * Logo « MT » de la marque. Décoratif : le nom de l'application est écrit à côté.
 * Les classes `logo-letter-m` et `logo-letter-t` servent à l'animation d'ouverture.
 */
export function BrandMark({ className }: { className?: string }) {
  // Un identifiant par exemplaire : un dégradé défini dans un logo masqué ne
  // serait pas appliqué aux logos visibles qui le réutiliseraient.
  const gradientId = `brand-gradient-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <svg
      data-slot="brand-mark"
      aria-hidden
      viewBox="0 0 966 735"
      className={cn("h-7 w-auto shrink-0 overflow-visible", className)}
    >
      <g className="logo-letter-m" fill={SLATE}>
        {LETTER_M.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className="logo-letter-t">
        {LETTER_T.map((d) => (
          <path key={d} d={d} fill={BLUE} />
        ))}
        <path d={LETTER_T_SHINE} fill={`url(#${gradientId})`} opacity="0.66" />
        <path d={LETTER_T_SHADE} fill={SLATE} />
      </g>
      <defs>
        <linearGradient
          id={gradientId}
          x1="1018.5"
          y1="-64.5303"
          x2="256.5"
          y2="734.97"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0476FB" />
          <stop offset="1" stopColor="#37585F" />
        </linearGradient>
      </defs>
    </svg>
  );
}
