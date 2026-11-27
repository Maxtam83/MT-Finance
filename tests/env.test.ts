import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEnv } from "../src/lib/env.schema.ts";

const validEnv = {
  DATABASE_URL: "file:./dev.db",
  DATABASE_AUTH_TOKEN: "",
  ENCRYPTION_KEY: "0f".repeat(32),
  ADMIN_EMAIL: "  Admin@Example.com ",
  BETTER_AUTH_SECRET: "valeur-de-test-sans-aucune-importance",
  BETTER_AUTH_URL: "http://localhost:3000",
  GITHUB_CLIENT_ID: "test-id",
  GITHUB_CLIENT_SECRET: "test-secret",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
};

test("accepte une configuration locale et normalise l'email administrateur", () => {
  const env = parseEnv(validEnv);
  assert.equal(env.ADMIN_EMAIL, "admin@example.com");
  assert.equal(env.DATABASE_AUTH_TOKEN, undefined);
  assert.equal(env.GOOGLE_CLIENT_ID, undefined);
});

test("accepte l'absence des variables facultatives", () => {
  const minimal: Record<string, string> = { ...validEnv };
  delete minimal.DATABASE_AUTH_TOKEN;
  delete minimal.GOOGLE_CLIENT_ID;
  delete minimal.GOOGLE_CLIENT_SECRET;
  assert.doesNotThrow(() => parseEnv(minimal));
});

const invalidCases: [string, Record<string, string | undefined>, RegExp][] = [
  ["une clé de chiffrement trop courte", { ENCRYPTION_KEY: "abcd" }, /ENCRYPTION_KEY/],
  ["une variable manquante", { ADMIN_EMAIL: undefined }, /ADMIN_EMAIL : variable manquante/],
  ["un secret trop court", { BETTER_AUTH_SECRET: "court" }, /BETTER_AUTH_SECRET/],
  ["Turso sans token", { DATABASE_URL: "libsql://base.turso.io" }, /DATABASE_AUTH_TOKEN/],
  ["un fichier local sur Vercel", { VERCEL: "1" }, /DATABASE_URL/],
  ["http hors machine locale", { BETTER_AUTH_URL: "http://exemple.fr" }, /BETTER_AUTH_URL/],
  ["un fournisseur incomplet", { GOOGLE_CLIENT_ID: "id" }, /GOOGLE_CLIENT_SECRET/],
  [
    "aucun fournisseur OAuth",
    { GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "" },
    /fournisseur OAuth/,
  ],
];

for (const [label, override, expected] of invalidCases) {
  test(`refuse ${label}`, () => {
    assert.throws(() => parseEnv({ ...validEnv, ...override }), expected);
  });
}

test("n'écrit aucune valeur dans le message d'erreur", () => {
  assert.throws(
    () => parseEnv({ ...validEnv, ENCRYPTION_KEY: "valeur-confidentielle" }),
    (error: Error) => !error.message.includes("valeur-confidentielle"),
  );
});
