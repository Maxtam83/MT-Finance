import assert from "node:assert/strict";
import { test } from "node:test";
import { decrypt, encrypt, hashImportId } from "../src/lib/crypto.ts";

// Valeurs fictives, propres aux tests. L'environnement est lu au premier appel.
Object.assign(process.env, {
  DATABASE_URL: "file:./test.db",
  ENCRYPTION_KEY: "ab".repeat(32),
  ADMIN_EMAIL: "admin@example.com",
  BETTER_AUTH_SECRET: "valeur-de-test-sans-aucune-importance",
  BETTER_AUTH_URL: "http://localhost:3000",
  GITHUB_CLIENT_ID: "test-id",
  GITHUB_CLIENT_SECRET: "test-secret",
});

test("déchiffre ce qui a été chiffré, accents et chaîne vide compris", () => {
  for (const plainText of ["", "CB Boulangerie", "Épargne — 1 234,56 € 🥖", "a:b:c"]) {
    assert.equal(decrypt(encrypt(plainText)), plainText);
  }
});

test("produit le format iv:authTag:cipherText avec un IV de 12 octets", () => {
  assert.match(encrypt("secret"), /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]{12}$/);
});

test("utilise un IV différent à chaque chiffrement", () => {
  assert.notEqual(encrypt("secret"), encrypt("secret"));
});

test("refuse une donnée altérée", () => {
  const [iv, tag, cipherText = ""] = encrypt("montant : 100").split(":");
  const altered = (cipherText.startsWith("0") ? "1" : "0") + cipherText.slice(1);
  assert.throws(() => decrypt(`${iv}:${tag}:${altered}`));
});

test("refuse une étiquette d'authentification tronquée", () => {
  const [iv, tag = "", cipherText] = encrypt("secret").split(":");
  assert.throws(() => decrypt(`${iv}:${tag.slice(0, 8)}:${cipherText}`));
});

test("refuse un format invalide", () => {
  for (const value of ["", "abc", "aa:bb:cc", `${encrypt("x")}:00`]) {
    assert.throws(() => decrypt(value), /Format/);
  }
});

test("calcule une empreinte d'import déterministe et propre à chaque compte", () => {
  const hash = hashImportId("compte-1", "FITID-42");
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hashImportId("compte-1", "FITID-42"), hash);
  assert.notEqual(hashImportId("compte-2", "FITID-42"), hash);
  assert.notEqual(hashImportId("compte-1", "FITID-43"), hash);
  assert.notEqual(hashImportId("ab", "c"), hashImportId("a", "bc"));
});
