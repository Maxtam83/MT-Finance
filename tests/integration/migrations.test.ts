import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  deployMigrations,
  describeTarget,
  loadMigrations,
  runDeployCli,
} from "../../scripts/lib/migrations.ts";
import { createWorkspace, removeWorkspace } from "../helpers/workspace";

let workspace: string;
let migrationsDirectory: string;
let url: string;
let messages: string[];

/** Ajoute une migration au projet fictif. */
async function addMigration(name: string, sql: string): Promise<void> {
  await mkdir(path.join(migrationsDirectory, name), { recursive: true });
  await writeFile(path.join(migrationsDirectory, name, "migration.sql"), sql);
}

/** Lance le déploiement sur la base jetable. */
const deploy = (dryRun = false) =>
  deployMigrations({
    url,
    directory: migrationsDirectory,
    dryRun,
    log: (message) => messages.push(message),
  });

/** Exécute une requête sur la base jetable. */
async function query(sql: string) {
  const client = createClient({ url });
  try {
    return (await client.execute(sql)).rows;
  } finally {
    client.close();
  }
}

/** Indique si une table existe. */
const hasTable = async (name: string) =>
  (await query(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='${name}'`)).length === 1;

beforeEach(async () => {
  workspace = await createWorkspace();
  migrationsDirectory = path.join(workspace, "migrations");
  url = `file:${path.join(workspace, "target.db").split(path.sep).join("/")}`;
  messages = [];
  await addMigration(
    "20260101000000_init",
    `CREATE TABLE "Parent" ("id" TEXT NOT NULL PRIMARY KEY);\r\n` +
      `CREATE TABLE "Child" ("id" TEXT NOT NULL PRIMARY KEY, "parentId" TEXT NOT NULL REFERENCES "Parent"("id") ON DELETE CASCADE);`,
  );
});

afterEach(async () => {
  await removeWorkspace(workspace);
});

describe("loadMigrations", () => {
  test("ignore les fichiers et trie par ordre chronologique", async () => {
    await addMigration("20250101000000_avant", "SELECT 1;");
    await writeFile(path.join(migrationsDirectory, "migration_lock.toml"), "");

    const names = (await loadMigrations(migrationsDirectory)).map((migration) => migration.name);

    expect(names).toEqual(["20250101000000_avant", "20260101000000_init"]);
  });

  test("refuse un nom de dossier inattendu", async () => {
    await addMigration("x'); DROP TABLE y;--", "SELECT 1;");

    await expect(loadMigrations(migrationsDirectory)).rejects.toThrow("inattendu");
  });
});

describe("deployMigrations", () => {
  test("liste sans rien modifier en simulation", async () => {
    await deploy(true);

    expect(messages).toContain("  - 20260101000000_init");
    expect(await hasTable("Parent")).toBe(false);
    expect(await hasTable("_app_migrations")).toBe(false);
  });

  test("applique une seule fois, puis ne signale plus rien", async () => {
    await deploy();
    await deploy();
    await deploy(true);

    expect(messages).toContain("Appliquée : 20260101000000_init");
    expect(messages.filter((message) => message === "Aucune migration en attente.")).toHaveLength(2);
  });

  test("annule entièrement une migration qui échoue", async () => {
    await deploy();
    await addMigration(
      "20260102000000_casse",
      `CREATE TABLE "Partielle" ("id" TEXT);\nINSERT INTO "Inexistante" VALUES (1);`,
    );

    await expect(deploy()).rejects.toThrow("migration annulée");

    expect(await hasTable("Partielle")).toBe(false);
    expect(await query("SELECT name FROM _app_migrations")).toHaveLength(1);
  });

  test("garde les données liées quand une table est recréée", async () => {
    await deploy();
    await query(`INSERT INTO "Parent" VALUES ('p')`);
    await query(`INSERT INTO "Child" VALUES ('c','p')`);
    await addMigration(
      "20260102000000_recree",
      `PRAGMA defer_foreign_keys=ON;\nPRAGMA foreign_keys=OFF;\n` +
        `CREATE TABLE "new_Parent" ("id" TEXT NOT NULL PRIMARY KEY, "note" TEXT);\n` +
        `INSERT INTO "new_Parent" ("id") SELECT "id" FROM "Parent";\n` +
        `DROP TABLE "Parent";\nALTER TABLE "new_Parent" RENAME TO "Parent";\n` +
        `PRAGMA foreign_keys=ON;\nPRAGMA defer_foreign_keys=OFF;`,
    );

    await deploy();

    expect(await query(`SELECT * FROM "Child"`)).toHaveLength(1);
  });

  test("signale les clés étrangères rompues", async () => {
    await deploy();
    await addMigration("20260102000000_orphelin", `INSERT INTO "Child" VALUES ('c','absent');`);

    await expect(deploy()).rejects.toThrow("violent une clé étrangère");
  });

  test("refuse une migration modifiée après son application", async () => {
    await deploy();
    await addMigration("20260101000000_init", "SELECT 2;");

    await expect(deploy()).rejects.toThrow("a été modifiée");
  });

  test("refuse une base en avance sur le projet", async () => {
    await deploy();
    await rm(path.join(migrationsDirectory, "20260101000000_init"), { recursive: true });

    await expect(deploy()).rejects.toThrow("absente du projet");
  });
});

describe("describeTarget", () => {
  test("n'affiche jamais le token d'une base distante", () => {
    const described = describeTarget("libsql://base.turso.io?authToken=secret");

    expect(described).toBe("libsql://base.turso.io");
    expect(describeTarget("file:./dev.db")).toBe("file:./dev.db");
  });
});

describe("runDeployCli", () => {
  const logger = { log: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    logger.log.mockReset();
    logger.error.mockReset();
  });

  test.each([
    [{}, "DATABASE_URL est absente"],
    [{ DATABASE_URL: "libsql://base.turso.io", DATABASE_AUTH_TOKEN: "" }, "DATABASE_AUTH_TOKEN"],
  ])("refuse la configuration %o", async (env, message) => {
    await expect(runDeployCli([], env, logger)).resolves.toBe(1);

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(message));
  });

  test("utilise le dossier demandé et respecte la simulation", async () => {
    const code = await runDeployCli(
      [`--dir=${migrationsDirectory}`, "--dry-run"],
      { DATABASE_URL: url },
      logger,
    );

    expect(code).toBe(0);
    expect(logger.log).toHaveBeenCalledWith("  - 20260101000000_init");
  });

  test("lit par défaut les migrations du projet", async () => {
    await expect(runDeployCli(["--dry-run"], { DATABASE_URL: url }, logger)).resolves.toBe(0);

    expect(logger.log).toHaveBeenCalledWith(expect.stringMatching(/_joint_account_requests$/));
  });

  test("affiche la cause d'un échec", async () => {
    await addMigration("20260102000000_casse", "CECI N'EST PAS DU SQL;");

    await expect(
      runDeployCli([`--dir=${migrationsDirectory}`], { DATABASE_URL: url }, logger),
    ).resolves.toBe(1);

    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/^Cause : /));
  });

  test("accepte une valeur levée qui n'est pas une erreur", async () => {
    logger.log.mockImplementation(() => {
      throw "panne d'affichage";
    });

    await expect(
      runDeployCli([`--dir=${migrationsDirectory}`], { DATABASE_URL: url }, logger),
    ).resolves.toBe(1);
    expect(logger.error).toHaveBeenCalledWith("panne d'affichage");
  });
});

describe("point d'entrée", () => {
  test("transmet la ligne de commande et fixe le code de sortie", async () => {
    const run = vi.fn().mockResolvedValue(3);
    vi.doMock("../../scripts/lib/migrations.ts", () => ({ runDeployCli: run }));
    const previousExitCode = process.exitCode;

    await import("../../scripts/db-deploy.ts");

    expect(run).toHaveBeenCalledWith(process.argv.slice(2), process.env, console);
    expect(process.exitCode).toBe(3);
    process.exitCode = previousExitCode;
    vi.doUnmock("../../scripts/lib/migrations.ts");
  });
});
