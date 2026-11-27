import path from "node:path";
import { deployMigrations } from "../../scripts/lib/migrations.ts";
import { setTestEnv } from "./env";
import { createWorkspace, removeWorkspace } from "./workspace";

/**
 * Crée une base SQLite jetable avec les vraies migrations du projet, et pointe
 * l'environnement de test dessus. À appeler avant d'importer `@/lib/prisma`.
 */
export async function createTestDatabase(): Promise<{ url: string; remove: () => Promise<void> }> {
  const directory = await createWorkspace();
  const url = `file:${path.join(directory, "test.db").split(path.sep).join("/")}`;

  await deployMigrations({
    url,
    directory: path.resolve("prisma/migrations"),
    dryRun: false,
    log: () => {},
  });
  setTestEnv({ DATABASE_URL: url });

  return { url, remove: () => removeWorkspace(directory) };
}
