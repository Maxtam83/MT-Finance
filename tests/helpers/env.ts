/** Environnement fictif, propre aux tests. Aucune valeur n'est réelle. */
export const TEST_ENV = {
  DATABASE_URL: "file:./test.db",
  DATABASE_AUTH_TOKEN: "",
  ENCRYPTION_KEY: "ab".repeat(32),
  ADMIN_EMAIL: "admin@mt-finance.test",
  BETTER_AUTH_SECRET: "valeur-de-test-sans-aucune-importance",
  BETTER_AUTH_URL: "http://localhost:3000",
  GITHUB_CLIENT_ID: "test-id",
  GITHUB_CLIENT_SECRET: "test-secret",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  VERCEL: "",
} satisfies Record<string, string>;

/** Charge l'environnement de test, avec d'éventuels remplacements. */
export function setTestEnv(overrides: Partial<Record<keyof typeof TEST_ENV, string>> = {}): void {
  Object.assign(process.env, TEST_ENV, overrides);
}
