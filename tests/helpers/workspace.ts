import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/** Dossier qui réunit tous les fichiers temporaires des tests. */
export const TEST_ROOT = path.join(tmpdir(), "mt-finance-tests");

/** Crée un dossier de travail jetable. */
export async function createWorkspace(): Promise<string> {
  await mkdir(TEST_ROOT, { recursive: true });
  return mkdtemp(path.join(TEST_ROOT, "run-"));
}

/**
 * Supprime un dossier sans insister. Sous Windows, libSQL garde le fichier
 * verrouillé un moment après sa fermeture : attendre ralentirait chaque test.
 * Les restes sont purgés au démarrage de l'exécution suivante.
 */
export async function removeWorkspace(directory: string): Promise<void> {
  await rm(directory, { recursive: true, force: true }).catch(() => undefined);
}
