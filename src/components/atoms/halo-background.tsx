/** Halos diffus en arrière-plan, repris de maxime-tamarin.fr. Décoratif. */
export function HaloBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-halo-primary blur-[140px]" />
      <div className="absolute top-1/3 left-1/3 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-halo-slate blur-[100px]" />
    </div>
  );
}
