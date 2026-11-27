import { BrandMark } from "@/components/atoms/brand-mark";

/** Monogramme suivi du nom de l'application. */
export function Brand() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight">
      <BrandMark />
      MT Finance
    </span>
  );
}
