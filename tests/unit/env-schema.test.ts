import { describe, expect, test } from "vitest";
import { parseEnv } from "@/lib/env.schema";
import { TEST_ENV } from "../helpers/env";

describe("parseEnv", () => {
  test("accepte une configuration locale et normalise l'email administrateur", () => {
    const env = parseEnv({ ...TEST_ENV, ADMIN_EMAIL: "  Admin@Example.com " });

    expect(env.ADMIN_EMAIL).toBe("admin@example.com");
    expect(env.DATABASE_AUTH_TOKEN).toBeUndefined();
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  test("accepte l'absence des variables facultatives", () => {
    const minimal: Record<string, string> = { ...TEST_ENV };
    delete minimal.DATABASE_AUTH_TOKEN;
    delete minimal.GOOGLE_CLIENT_ID;
    delete minimal.GOOGLE_CLIENT_SECRET;
    delete minimal.VERCEL;

    expect(() => parseEnv(minimal)).not.toThrow();
  });

  test.each([
    ["Turso avec token", { DATABASE_URL: "libsql://b.turso.io", DATABASE_AUTH_TOKEN: "t" }],
    ["la production en https", { BETTER_AUTH_URL: "https://finance.exemple.fr" }],
    ["l'adresse de boucle locale", { BETTER_AUTH_URL: "http://127.0.0.1:3000" }],
  ])("accepte %s", (_label, override) => {
    expect(() => parseEnv({ ...TEST_ENV, ...override })).not.toThrow();
  });

  test.each([
    ["une clé de chiffrement trop courte", { ENCRYPTION_KEY: "abcd" }, /ENCRYPTION_KEY/],
    ["une variable manquante", { ADMIN_EMAIL: undefined }, /ADMIN_EMAIL : variable manquante/],
    ["un secret trop court", { BETTER_AUTH_SECRET: "court" }, /BETTER_AUTH_SECRET/],
    ["une base d'un autre type", { DATABASE_URL: "mysql://localhost" }, /DATABASE_URL/],
    ["Turso sans token", { DATABASE_URL: "libsql://base.turso.io" }, /DATABASE_AUTH_TOKEN/],
    ["un fichier local sur Vercel", { VERCEL: "1" }, /DATABASE_URL/],
    ["http hors machine locale", { BETTER_AUTH_URL: "http://exemple.fr" }, /BETTER_AUTH_URL/],
    ["un identifiant sans secret", { GOOGLE_CLIENT_ID: "id" }, /GOOGLE_CLIENT_SECRET/],
    ["un secret sans identifiant", { GOOGLE_CLIENT_SECRET: "s" }, /GOOGLE_CLIENT_ID/],
    [
      "aucun fournisseur OAuth",
      { GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "" },
      /fournisseur OAuth/,
    ],
  ])("refuse %s", (_label, override, expected) => {
    expect(() => parseEnv({ ...TEST_ENV, ...override })).toThrow(expected);
  });

  test("nomme « environnement » une erreur sans variable précise", () => {
    expect(() => parseEnv(null as unknown as Record<string, string>)).toThrow(/environnement/);
  });

  test("n'écrit aucune valeur dans le message d'erreur", () => {
    expect(() => parseEnv({ ...TEST_ENV, ENCRYPTION_KEY: "valeur-confidentielle" })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("valeur-confidentielle"),
      }),
    );
  });
});
