import { removeWorkspace, TEST_ROOT } from "./workspace";

/** Purge, avant les tests, les bases laissées par l'exécution précédente. */
export default async function setup(): Promise<void> {
  await removeWorkspace(TEST_ROOT);
}
