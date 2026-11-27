/**
 * Doublures des API serveur de Next.js. À brancher dans chaque test avec
 * `vi.mock("next/headers", …)` et `vi.mock("next/navigation", …)`.
 */
export const requestState = { cookie: "" };

/** Signale une redirection, comme le fait `redirect()` dans Next.js. */
export class RedirectSignal extends Error {
  constructor(readonly destination: string) {
    super(`redirection vers ${destination}`);
  }
}

export const nextHeadersMock = {
  headers: async () => new Headers(requestState.cookie ? { cookie: requestState.cookie } : {}),
  cookies: async () => ({ get: () => undefined, set: () => {}, getAll: () => [] }),
};

export const nextNavigationMock = {
  redirect: (destination: string): never => {
    throw new RedirectSignal(destination);
  },
};

/** Construit les données d'un formulaire. */
export function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}
