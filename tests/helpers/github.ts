import { vi } from "vitest";

/** Identités fictives. Le « code » OAuth désigne l'identité à simuler. */
const IDENTITIES: Record<string, { id: number; email: string; verified: boolean }> = {
  admin: { id: 1001, email: "Admin@MT-Finance.test", verified: true },
  alice: { id: 1002, email: "alice@mt-finance.test", verified: true },
  mallory: { id: 1003, email: "mallory@mt-finance.test", verified: true },
  bob: { id: 1004, email: "bob@mt-finance.test", verified: false },
};

const BASE_URL = "http://localhost:3000";

interface AuthHandler {
  handler: (request: Request) => Promise<Response>;
}

/** Simule les réponses de GitHub : aucun appel ne quitte la machine. */
export function mockGitHub(): void {
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    if (url.host === "github.com" && url.pathname === "/login/oauth/access_token") {
      const code = new URLSearchParams(await request.text()).get("code");
      return Response.json({ access_token: `fake-${code}`, token_type: "bearer" });
    }
    if (url.host === "api.github.com") {
      const name = (request.headers.get("authorization") ?? "").replace(/^Bearer fake-/i, "");
      const identity = IDENTITIES[name];
      if (!identity) return Response.json({}, { status: 401 });
      if (url.pathname === "/user") {
        return Response.json({ id: identity.id, login: name, name, email: null });
      }
      return Response.json([
        { email: identity.email, primary: true, verified: identity.verified },
      ]);
    }
    throw new Error(`Appel réseau inattendu pendant les tests : ${url.host}`);
  });
}

/** Envoie une requête à l'API d'authentification, comme le ferait un navigateur. */
export function callAuth(
  auth: AuthHandler,
  path: string,
  options: { cookie?: string; body?: unknown } = {},
): Promise<Response> {
  const headers = new Headers({ origin: BASE_URL });
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.body !== undefined) headers.set("content-type", "application/json");

  return auth.handler(
    new Request(`${BASE_URL}/api/auth${path}`, {
      method: options.body === undefined ? "GET" : "POST",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  );
}

/** Assemble les cookies posés par une réponse. */
function readCookies(response: Response): string[] {
  return response.headers
    .getSetCookie()
    .map((line) => line.split(";")[0] ?? "")
    .filter((pair) => !pair.endsWith("="));
}

/** Parcourt une connexion GitHub complète et renvoie son résultat. */
export async function signInWithGitHub(
  auth: AuthHandler,
  identity: keyof typeof IDENTITIES | string,
): Promise<{ location: string; cookie: string; hasSession: boolean }> {
  const start = await callAuth(auth, "/sign-in/social", {
    body: { provider: "github", callbackURL: "/", errorCallbackURL: "/login" },
  });
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");
  const stateCookies = readCookies(start);

  const callback = await callAuth(auth, `/callback/github?code=${identity}&state=${state}`, {
    cookie: stateCookies.join("; "),
  });
  const sessionCookies = readCookies(callback).filter((pair) => pair.includes("session_token"));

  return {
    location: (callback.headers.get("location") ?? "").replace(BASE_URL, ""),
    cookie: sessionCookies.join("; "),
    hasSession: sessionCookies.length > 0,
  };
}
