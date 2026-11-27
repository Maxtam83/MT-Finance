import "server-only";
// Extension `.ts` explicite : ce module est aussi exécuté par `node --test`.
import { parseEnv } from "./env.schema.ts";
import type { Env } from "./env.schema.ts";

let cachedEnv: Env | undefined;

/** Environnement validé, lu une seule fois. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
