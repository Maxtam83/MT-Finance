/** Exécuté au démarrage du serveur : échoue tôt si la configuration est invalide. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { parseEnv } = await import("./lib/env.schema");
  parseEnv(process.env);
}
