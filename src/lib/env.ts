import "server-only";
import { parseEnv } from "@/lib/env.schema";
import type { Env } from "@/lib/env.schema";

let cachedEnv: Env | undefined;

/** Environnement validé, lu une seule fois. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
