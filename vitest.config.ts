import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Chemin absolu à partir de la racine du projet. */
const fromRoot = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      // `server-only` lève une erreur hors de Next.js : il est neutralisé ici.
      "server-only": fromRoot("./tests/helpers/empty.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    // Les tests d'interface demandent jsdom en tête de fichier.
    environment: "node",
    setupFiles: ["./tests/helpers/setup.ts"],
    globalSetup: ["./tests/helpers/global-setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.ts", "next.config.ts", "prisma.config.ts"],
      exclude: ["src/generated/**"],
      reporter: ["text", "html"],
      // La couverture doit rester complète : en dessous, la commande échoue.
      thresholds: { 100: true },
    },
  },
});
