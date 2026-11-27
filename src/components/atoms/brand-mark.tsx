/** Monogramme « MT » aux deux teintes de la marque. Décoratif. */
export function BrandMark() {
  return (
    <span aria-hidden className="text-2xl leading-none font-extrabold tracking-tighter italic">
      <span className="text-brand-slate">M</span>
      <span className="text-brand">T</span>
    </span>
  );
}
