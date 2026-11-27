import { AnimatedBrandMark } from "@/components/atoms/animated-brand-mark";
import { HaloBackground } from "@/components/atoms/halo-background";

/**
 * Animation du logo à l'ouverture de l'application (styles dans `globals.css`).
 * Entièrement en CSS : elle disparaît seule, même avant ou sans JavaScript.
 * Placée dans la mise en page racine, elle n'est pas rejouée quand on change de
 * page dans l'application.
 */
export function SplashScreen() {
  return (
    // Purement décorative : ignorée par les lecteurs d'écran, qui lisent la page.
    <div data-slot="splash-screen" aria-hidden className="splash">
      <HaloBackground />
      <div className="splash-content relative flex flex-col items-center gap-5">
        <div className="relative">
          {/* Lueur qui éclot derrière le logo pendant que le « T » se trace. */}
          <div className="splash-glow absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-halo-glow blur-3xl md:size-80" />
          <AnimatedBrandMark className="relative h-32 w-auto md:h-40" />
        </div>
        <span className="splash-wordmark text-gradient text-4xl font-extrabold tracking-tight md:text-5xl">
          Finance
        </span>
      </div>
    </div>
  );
}
