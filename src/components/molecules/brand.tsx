import { BrandMark } from "@/components/atoms/brand-mark";

/** Monogramme suivi du nom de l'application. */
export function Brand() {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <BrandMark />
      <span>
        <span className="sr-only">MT </span>Finance
      </span>
    </span>
  );
}
