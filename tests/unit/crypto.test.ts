import { describe, expect, test } from "vitest";
import { setTestEnv } from "../helpers/env";

setTestEnv();
const { decrypt, encrypt, hashImportId } = await import("@/lib/crypto");

describe("encrypt et decrypt", () => {
  test.each(["", "CB Boulangerie", "Épargne — 1 234,56 € 🥖", "a:b:c"])(
    "restitue « %s »",
    (plainText) => {
      expect(decrypt(encrypt(plainText))).toBe(plainText);
    },
  );

  test("produit le format iv:authTag:cipherText avec un IV de 12 octets", () => {
    expect(encrypt("secret")).toMatch(/^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]{12}$/);
  });

  test("utilise un IV différent à chaque chiffrement", () => {
    expect(encrypt("secret")).not.toBe(encrypt("secret"));
  });

  test("refuse une donnée altérée", () => {
    const [iv, tag, cipherText = ""] = encrypt("montant : 100").split(":");
    const altered = (cipherText.startsWith("0") ? "1" : "0") + cipherText.slice(1);

    expect(() => decrypt(`${iv}:${tag}:${altered}`)).toThrow();
  });

  test("refuse une étiquette d'authentification tronquée", () => {
    const [iv, tag = "", cipherText] = encrypt("secret").split(":");

    expect(() => decrypt(`${iv}:${tag.slice(0, 8)}:${cipherText}`)).toThrow();
  });

  test.each(["", "abc", "aa:bb:cc", `${"0".repeat(24)}:${"0".repeat(32)}:0`])(
    "refuse le format « %s »",
    (value) => {
      expect(() => decrypt(value)).toThrow(/Format/);
    },
  );
});

describe("hashImportId", () => {
  test("est déterministe et propre à chaque compte", () => {
    const hash = hashImportId("compte-1", "FITID-42");

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashImportId("compte-1", "FITID-42")).toBe(hash);
    expect(hashImportId("compte-2", "FITID-42")).not.toBe(hash);
    expect(hashImportId("compte-1", "FITID-43")).not.toBe(hash);
    expect(hashImportId("ab", "c")).not.toBe(hashImportId("a", "bc"));
  });
});
