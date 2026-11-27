import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
// Extension `.ts` explicite : ce module est aussi exécuté par `node --test`.
import { getEnv } from "./env.ts";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
/** Format attendu : ivHex:authTagHex:cipherTextHex (texte chiffré éventuellement vide). */
const PAYLOAD_PATTERN = /^([0-9a-f]{24}):([0-9a-f]{32}):((?:[0-9a-f]{2})*)$/i;
const IMPORT_HASH_CONTEXT = "mt-finance:import-hash:v1";

function getEncryptionKey(): Buffer {
  return Buffer.from(getEnv().ENCRYPTION_KEY, "hex");
}

export function encrypt(plainText: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  const cipherText = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);

  return [iv, cipher.getAuthTag(), cipherText].map((part) => part.toString("hex")).join(":");
}

/** Lève une erreur si la donnée est mal formée, altérée ou chiffrée avec une autre clé. */
export function decrypt(encryptedText: string): string {
  const match = PAYLOAD_PATTERN.exec(encryptedText);
  if (!match) {
    throw new Error("Format de donnée chiffrée invalide.");
  }
  const [, ivHex = "", authTagHex = "", cipherTextHex = ""] = match;

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivHex, "hex"), {
    // Impose une étiquette complète : une étiquette tronquée est refusée.
    authTagLength: AUTH_TAG_BYTES,
  });
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(cipherTextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Empreinte déterministe d'une opération importée, pour ne pas l'importer deux
 * fois sans conserver l'identifiant bancaire en clair.
 */
export function hashImportId(accountId: string, rawId: string): string {
  // Sous-clé dérivée de ENCRYPTION_KEY : la clé AES n'est jamais réutilisée pour le HMAC.
  const hmacKey = Buffer.from(
    hkdfSync("sha256", getEncryptionKey(), Buffer.alloc(0), IMPORT_HASH_CONTEXT, 32),
  );

  // La sérialisation JSON évite que ("ab", "c") et ("a", "bc") donnent la même empreinte.
  return createHmac("sha256", hmacKey)
    .update(JSON.stringify([accountId, rawId]))
    .digest("hex");
}
