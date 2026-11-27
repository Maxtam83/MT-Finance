/**
 * Application à Turso des migrations SQL générées par Prisma.
 *
 * Le CLI Prisma ne se connecte pas à une base libSQL distante : il génère le SQL
 * en local (`npm run db:migrate`), puis ce module l'envoie vers Turso.
 *
 * Garanties :
 *  - seules les migrations absentes de la table `_app_migrations` sont jouées,
 *    dans l'ordre chronologique ;
 *  - chaque migration et son enregistrement forment une seule transaction ;
 *  - l'exécution s'arrête à la première erreur ;
 *  - une migration déjà appliquée ne doit plus être modifiée (somme de contrôle).
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";

const TRACKING_TABLE = "_app_migrations";
// Format Prisma : horodatage à 14 chiffres puis nom. Garantit aussi que le nom
// peut être inséré tel quel dans le script SQL.
const MIGRATION_NAME = /^\d{14}_[A-Za-z0-9_]+$/;

export interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

export interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

export interface DeployOptions {
  url: string;
  authToken?: string;
  /** Dossier des migrations Prisma. */
  directory: string;
  /** Liste les migrations en attente sans rien modifier. */
  dryRun: boolean;
  log: (message: string) => void;
}

/** Lit les migrations du projet, triées par ordre chronologique. */
export async function loadMigrations(directory: string): Promise<Migration[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    names.map(async (name) => {
      if (!MIGRATION_NAME.test(name)) {
        throw new Error(`Nom de dossier de migration inattendu : "${name}".`);
      }
      const raw = await readFile(path.join(directory, name, "migration.sql"), "utf8");
      // Les fins de ligne Windows ne doivent pas changer la somme de contrôle.
      const sql = raw.replace(/\r\n/g, "\n");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    }),
  );
}

/** Migrations déjà appliquées à la base, avec leur somme de contrôle. */
async function loadApplied(client: Client, createIfMissing: boolean): Promise<Map<string, string>> {
  if (createIfMissing) {
    await client.execute(
      `CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
         name TEXT NOT NULL PRIMARY KEY,
         checksum TEXT NOT NULL,
         applied_at TEXT NOT NULL
       )`,
    );
  } else {
    const existing = await client.execute({
      sql: "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
      args: [TRACKING_TABLE],
    });
    if (existing.rows.length === 0) return new Map();
  }

  const result = await client.execute(`SELECT name, checksum FROM ${TRACKING_TABLE}`);
  return new Map(result.rows.map((row) => [String(row.name), String(row.checksum)]));
}

/** Refuse un historique de base qui ne correspond plus aux fichiers du projet. */
function assertHistoryMatches(local: Migration[], applied: Map<string, string>): void {
  const localByName = new Map(local.map((migration) => [migration.name, migration]));
  for (const [name, checksum] of applied) {
    const migration = localByName.get(name);
    if (!migration) {
      throw new Error(
        `La base contient la migration "${name}", absente du projet. Mettez votre code à jour.`,
      );
    }
    if (migration.checksum !== checksum) {
      throw new Error(
        `La migration "${name}" a été modifiée après son application. Restaurez-la et créez une nouvelle migration.`,
      );
    }
  }
}

/** Joue une migration et son enregistrement dans une même transaction. */
async function applyMigration(client: Client, migration: Migration): Promise<void> {
  // Les clés étrangères doivent être coupées AVANT la transaction : sinon,
  // quand Prisma recrée une table (DROP puis RENAME), les suppressions en
  // cascade effaceraient les données des tables liées.
  // En cas d'erreur, la transaction ouverte est annulée par le client libSQL.
  await client.executeMultiple(`
PRAGMA foreign_keys=OFF;
BEGIN IMMEDIATE;
${migration.sql}
;
INSERT INTO ${TRACKING_TABLE} (name, checksum, applied_at)
VALUES ('${migration.name}', '${migration.checksum}', datetime('now'));
COMMIT;
PRAGMA foreign_keys=ON;
`);
}

/** Décrit la base visée sans jamais afficher d'identifiant d'accès. */
export function describeTarget(url: string): string {
  if (url.startsWith("file:")) return url;
  const { protocol, host } = new URL(url);
  return `${protocol}//${host}`;
}

/** Applique les migrations en attente, ou les liste en mode `dryRun`. */
export async function deployMigrations({
  url,
  authToken,
  directory,
  dryRun,
  log,
}: DeployOptions): Promise<void> {
  const migrations = await loadMigrations(directory);
  const client = createClient({ url, authToken });

  try {
    log(`Base cible : ${describeTarget(url)}`);
    const applied = await loadApplied(client, !dryRun);
    assertHistoryMatches(migrations, applied);

    const pending = migrations.filter((migration) => !applied.has(migration.name));
    if (pending.length === 0) {
      log("Aucune migration en attente.");
      return;
    }

    if (dryRun) {
      log("Migrations en attente (rien n'a été modifié) :");
      for (const migration of pending) log(`  - ${migration.name}`);
      return;
    }

    for (const migration of pending) {
      try {
        await applyMigration(client, migration);
      } catch (error) {
        throw new Error(`Échec de "${migration.name}" : migration annulée, arrêt.`, {
          cause: error,
        });
      }
      log(`Appliquée : ${migration.name}`);
    }

    const violations = await client.execute("PRAGMA foreign_key_check");
    if (violations.rows.length > 0) {
      throw new Error(
        `${violations.rows.length} ligne(s) violent une clé étrangère. Vérifiez la base avant de déployer.`,
      );
    }
    log("Base à jour.");
  } finally {
    client.close();
  }
}

/** Interprète la ligne de commande et renvoie le code de sortie. */
export async function runDeployCli(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
  logger: Logger,
): Promise<number> {
  try {
    const url = env.DATABASE_URL;
    const authToken = env.DATABASE_AUTH_TOKEN || undefined;
    if (!url) {
      throw new Error("DATABASE_URL est absente. Renseignez-la dans le fichier .env.turso.");
    }
    if (!url.startsWith("file:") && !authToken) {
      throw new Error("DATABASE_AUTH_TOKEN est obligatoire pour une base distante.");
    }

    const directoryOption = args.find((argument) => argument.startsWith("--dir="));
    await deployMigrations({
      url,
      authToken,
      directory: path.resolve(directoryOption?.slice("--dir=".length) ?? "prisma/migrations"),
      dryRun: args.includes("--dry-run"),
      log: logger.log,
    });
    return 0;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.cause instanceof Error) {
      logger.error(`Cause : ${error.cause.message}`);
    }
    return 1;
  }
}
