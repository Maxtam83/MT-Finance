import { BrandMark } from "@/components/atoms/brand-mark";
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
      <BrandMark className="h-32 md:h-40" />
    </div>
  );
}
