import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { createTestDatabase } from "../helpers/database";
import { callAuth, mockGitHub, signInWithGitHub } from "../helpers/github";
import { nextHeadersMock } from "../helpers/next";

vi.mock("next/headers", () => nextHeadersMock);

const database = await createTestDatabase();
const { auth } = await import("@/lib/auth/server");
const { prisma } = await import("@/lib/prisma");

/** Utilisateur enregistré pour cette adresse. */
const findUser = (email: string) => prisma.user.findUnique({ where: { email } });

beforeAll(async () => {
  mockGitHub();
  await prisma.allowedEmail.createMany({
    data: [
      { email: "alice@mt-finance.test", addedBy: "test" },
      { email: "bob@mt-finance.test", addedBy: "test" },
    ],
  });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await prisma.$disconnect();
  await database.remove();
});

describe("inscription sur liste blanche", () => {
  test("refuse une adresse absente et ne crée aucun compte", async () => {
    const result = await signInWithGitHub(auth, "mallory");

    expect(result.location).toMatch(/^\/login\?error=EMAIL_NOT_ALLOWED/);
    expect(result.hasSession).toBe(false);
    expect(await findUser("mallory@mt-finance.test")).toBeNull();
  });

  test("donne le rôle ADMIN à l'administrateur et normalise son adresse", async () => {
    const result = await signInWithGitHub(auth, "admin");

    expect(result.location).toBe("/");
    expect(result.hasSession).toBe(true);
    expect((await findUser("admin@mt-finance.test"))?.role).toBe("ADMIN");
  });

  test("donne le rôle USER à une adresse de la liste blanche", async () => {
    const result = await signInWithGitHub(auth, "alice");

    expect(result.hasSession).toBe(true);
    expect((await findUser("alice@mt-finance.test"))?.role).toBe("USER");
  });

  test("refuse une adresse non vérifiée, même autorisée", async () => {
    const result = await signInWithGitHub(auth, "bob");

    expect(result.location).toMatch(/^\/login\?error=EMAIL_UNVERIFIED/);
    expect(await findUser("bob@mt-finance.test")).toBeNull();
  });

  test("n'enregistre jamais les jetons OAuth en clair", async () => {
    const account = await prisma.authAccount.findFirstOrThrow();

    expect(account.accessToken).toBeTruthy();
    expect(account.accessToken).not.toContain("fake-");
  });
});

describe("contournements", () => {
  test("empêche de s'attribuer le rôle ADMIN", async () => {
    const { cookie } = await signInWithGitHub(auth, "alice");

    await callAuth(auth, "/update-user", { cookie, body: { role: "ADMIN" } });

    expect((await findUser("alice@mt-finance.test"))?.role).toBe("USER");
  });

  test("désactive l'inscription par mot de passe", async () => {
    const response = await callAuth(auth, "/sign-up/email", {
      body: { email: "mallory@mt-finance.test", password: "mot-de-passe-de-test", name: "m" },
    });

    expect(response.ok).toBe(false);
    expect(await findUser("mallory@mt-finance.test")).toBeNull();
  });

  test("exige une session pour enregistrer une passkey", async () => {
    expect((await callAuth(auth, "/passkey/generate-register-options")).status).toBe(401);

    const { cookie } = await signInWithGitHub(auth, "alice");
    const response = await callAuth(auth, "/passkey/generate-register-options", { cookie });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { rp: { id: string } }).rp.id).toBe("localhost");
  });
});

describe("contrôle à chaque nouvelle session", () => {
  test("corrige un rôle devenu faux à la connexion suivante", async () => {
    await prisma.user.update({
      where: { email: "alice@mt-finance.test" },
      data: { role: "ADMIN" },
    });

    await signInWithGitHub(auth, "alice");

    expect((await findUser("alice@mt-finance.test"))?.role).toBe("USER");
  });

  test("refuse une personne retirée de la liste blanche, comme le ferait une passkey", async () => {
    const alice = await prisma.user.findUniqueOrThrow({
      where: { email: "alice@mt-finance.test" },
    });
    await prisma.allowedEmail.delete({ where: { email: alice.email } });
    const { internalAdapter } = await auth.$context;

    // La connexion par passkey crée la session par ce même chemin.
    await expect(internalAdapter.createSession(alice.id)).rejects.toMatchObject({
      body: { code: "EMAIL_NOT_ALLOWED" },
    });
    const again = await signInWithGitHub(auth, "alice");
    expect(again.location).toMatch(/^\/login\?error=EMAIL_NOT_ALLOWED/);
    expect(again.hasSession).toBe(false);
  });

  test("refuse une session pour un utilisateur inconnu", async () => {
    const { internalAdapter } = await auth.$context;

    await expect(internalAdapter.createSession("inconnu")).rejects.toMatchObject({
      body: { code: "EMAIL_NOT_ALLOWED" },
    });
  });
});

describe("limite de débit", () => {
  /** Instance qui applique la limite, comme en production. */
  const createServerInstance = async () => {
    const { betterAuth } = await import("better-auth");
    const { authOptions } = await import("@/lib/auth/server");
    return betterAuth({
      ...authOptions,
      rateLimit: { ...authOptions.rateLimit, enabled: true },
    });
  };

  /** Demande de connexion venant de l'adresse IP donnée ; renvoie le statut HTTP. */
  const attempt = async (
    instance: { handler: (request: Request) => Promise<Response> },
    ip: string,
  ) => {
    const response = await instance.handler(
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ provider: "github", callbackURL: "/" }),
      }),
    );
    return response.status;
  };

  /** Compteurs enregistrés en base pour une adresse. */
  const countersFor = (ip: string) =>
    prisma.rateLimit.findMany({ where: { key: { contains: ip } }, select: { count: true } });

  test("refuse la quatrième demande de connexion en dix secondes", async () => {
    const instance = await createServerInstance();

    for (let request = 0; request < 3; request++) {
      expect(await attempt(instance, "203.0.113.7")).toBe(200);
    }

    expect(await attempt(instance, "203.0.113.7")).toBe(429);
    expect(await countersFor("203.0.113.7")).toEqual([{ count: 3 }]);
    // Une autre adresse n'est pas pénalisée.
    expect(await attempt(instance, "198.51.100.4")).toBe(200);
  });

  // La mémoire d'un processus est commune à ses instances : seul un compteur
  // écrit en base, hors de ce processus, prouve que l'état est bien partagé.
  test("tient compte des demandes comptées par un autre serveur", async () => {
    const instance = await createServerInstance();
    expect(await attempt(instance, "192.0.2.55")).toBe(200);

    // Un autre serveur a compté deux demandes de la même adresse.
    await prisma.rateLimit.updateMany({
      where: { key: { contains: "192.0.2.55" } },
      data: { count: 3 },
    });

    expect(await attempt(instance, "192.0.2.55")).toBe(429);
  });
});

describe("fournisseurs et route", () => {
  test("n'active que les fournisseurs configurés", () => {
    expect(Object.keys(auth.options.socialProviders ?? {})).toEqual(["github"]);
  });

  test("expose l'API d'authentification en GET et en POST", async () => {
    const route = await import("@/app/api/auth/[...all]/route");

    expect(route.GET).toBeTypeOf("function");
    expect(route.POST).toBeTypeOf("function");
  });

  test("active Google seul quand lui seul est configuré", async () => {
    vi.resetModules();
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-test");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-secret-test");

    const reloaded = await import("@/lib/auth/server");

    expect(Object.keys(reloaded.auth.options.socialProviders ?? {})).toEqual(["google"]);
    vi.unstubAllEnvs();
  });
});
