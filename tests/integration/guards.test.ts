import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createTestDatabase } from "../helpers/database";
import { mockGitHub, signInWithGitHub } from "../helpers/github";
import { nextHeadersMock, nextNavigationMock, RedirectSignal, requestState } from "../helpers/next";

vi.mock("next/headers", () => nextHeadersMock);
vi.mock("next/navigation", () => nextNavigationMock);

const database = await createTestDatabase();
const { auth } = await import("@/lib/auth/server");
const { getAuthSession, requireAdmin, requireAuth } = await import("@/lib/auth/guards");
const { prisma } = await import("@/lib/prisma");

const cookies: Record<string, string> = {};

beforeAll(async () => {
  mockGitHub();
  await prisma.allowedEmail.create({ data: { email: "alice@mt-finance.test", addedBy: "test" } });
  for (const name of ["admin", "alice"]) {
    cookies[name] = (await signInWithGitHub(auth, name)).cookie;
  }
});

beforeEach(() => {
  requestState.cookie = "";
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await prisma.$disconnect();
  await database.remove();
});

describe("session", () => {
  test("est absente sans cookie, et requireAuth renvoie vers /login", async () => {
    expect(await getAuthSession()).toBeNull();
    await expect(requireAuth()).rejects.toEqual(new RedirectSignal("/login"));
  });

  test("donne l'identité et le rôle de la personne connectée", async () => {
    requestState.cookie = cookies.alice ?? "";

    await expect(requireAuth()).resolves.toMatchObject({
      user: { email: "alice@mt-finance.test", role: "USER" },
    });
  });

  test("est refusée pour une adresse redevenue non vérifiée", async () => {
    requestState.cookie = cookies.alice ?? "";
    const where = { email: "alice@mt-finance.test" };
    await prisma.user.update({ where, data: { emailVerified: false } });

    expect(await getAuthSession()).toBeNull();

    await prisma.user.update({ where, data: { emailVerified: true } });
  });

  test("est refusée si l'utilisateur n'existe plus", async () => {
    const spy = vi
      .spyOn(auth.api, "getSession")
      .mockResolvedValueOnce({ user: { id: "disparu" } } as never);

    expect(await getAuthSession()).toBeNull();
    spy.mockRestore();
  });
});

describe("requireAdmin", () => {
  test("laisse passer l'administrateur", async () => {
    requestState.cookie = cookies.admin ?? "";

    await expect(requireAdmin()).resolves.toMatchObject({ user: { role: "ADMIN" } });
  });

  test("renvoie un utilisateur à l'accueil", async () => {
    requestState.cookie = cookies.alice ?? "";

    await expect(requireAdmin()).rejects.toEqual(new RedirectSignal("/"));
  });

  test("ignore un rôle ADMIN écrit en base pour une autre adresse", async () => {
    requestState.cookie = cookies.alice ?? "";
    const where = { email: "alice@mt-finance.test" };
    await prisma.user.update({ where, data: { role: "ADMIN" } });

    await expect(requireAdmin()).rejects.toEqual(new RedirectSignal("/"));

    await prisma.user.update({ where, data: { role: "USER" } });
  });
});

describe("retrait d'accès", () => {
  test("prend effet sur une session déjà ouverte", async () => {
    requestState.cookie = cookies.alice ?? "";
    await prisma.allowedEmail.delete({ where: { email: "alice@mt-finance.test" } });

    await expect(requireAuth()).rejects.toEqual(new RedirectSignal("/login"));
  });
});
