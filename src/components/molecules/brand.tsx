import { BrandMark } from "@/components/atoms/brand-mark";

/** Logo suivi du nom de l'application. */
export function Brand() {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <BrandMark />
      <span>
        {/* Le logo dessine « MT » : les lecteurs d'écran l'entendent ici. */}
        <span className="sr-only">MT </span>Finance
      </span>
    </span>
  );
}
