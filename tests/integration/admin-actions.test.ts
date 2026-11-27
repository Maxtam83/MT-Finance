import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { initialActionState } from "@/actions/action-state";
import { createTestDatabase } from "../helpers/database";
import { mockGitHub, signInWithGitHub } from "../helpers/github";
import {
  formData,
  nextHeadersMock,
  nextNavigationMock,
  RedirectSignal,
  requestState,
} from "../helpers/next";

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => nextHeadersMock);
vi.mock("next/navigation", () => nextNavigationMock);
vi.mock("next/cache", () => ({ revalidatePath }));

const database = await createTestDatabase();
const { auth } = await import("@/lib/auth/server");
const { addAllowedEmail, removeAllowedEmail } = await import("@/actions/admin");
const { prisma } = await import("@/lib/prisma");

const cookies: Record<string, string> = {};

/** Ajoute une adresse en tant que personne actuellement connectée. */
const add = (email: string) => addAllowedEmail(initialActionState, formData({ email }));
/** Retire une entrée de la liste blanche. */
const remove = (id: string) => removeAllowedEmail(initialActionState, formData({ id }));

beforeAll(async () => {
  mockGitHub();
  await prisma.allowedEmail.create({ data: { email: "alice@mt-finance.test", addedBy: "test" } });
  for (const name of ["admin", "alice"]) {
    cookies[name] = (await signInWithGitHub(auth, name)).cookie;
  }
});

beforeEach(() => {
  requestState.cookie = cookies.admin ?? "";
  revalidatePath.mockClear();
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await prisma.$disconnect();
  await database.remove();
});

describe("protection des actions", () => {
  test.each([
    ["anonyme", "", "/login"],
    ["utilisateur", "alice", "/"],
  ])("refuse l'appel %s sans rien modifier", async (_label, who, destination) => {
    requestState.cookie = cookies[who] ?? "";
    const before = await prisma.allowedEmail.count();
    const entry = await prisma.allowedEmail.findFirstOrThrow();

    await expect(add("intrus@mt-finance.test")).rejects.toEqual(new RedirectSignal(destination));
    await expect(remove(entry.id)).rejects.toEqual(new RedirectSignal(destination));

    expect(await prisma.allowedEmail.count()).toBe(before);
  });
});

describe("addAllowedEmail", () => {
  test("autorise une adresse normalisée et rafraîchit la page", async () => {
    await expect(add("  Carol@MT-Finance.test ")).resolves.toMatchObject({ status: "success" });

    const entry = await prisma.allowedEmail.findUnique({
      where: { email: "carol@mt-finance.test" },
    });
    expect(entry?.addedBy).toBeTruthy();
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  test.each([
    ["pas-une-adresse", "Adresse email invalide."],
    ["admin@mt-finance.test", "L'administrateur est toujours autorisé."],
    ["alice@mt-finance.test", "Cet email est déjà autorisé."],
  ])("refuse « %s »", async (email, message) => {
    await expect(add(email)).resolves.toEqual({ status: "error", message });
  });

  test("laisse remonter une erreur inattendue", async () => {
    const spy = vi.spyOn(prisma.allowedEmail, "create").mockRejectedValueOnce(new Error("panne"));

    await expect(add("dave@mt-finance.test")).rejects.toThrow("panne");
    spy.mockRestore();
  });
});

describe("removeAllowedEmail", () => {
  test("refuse un identifiant mal formé ou inconnu", async () => {
    await expect(remove("../..")).resolves.toEqual({
      status: "error",
      message: "Identifiant invalide.",
    });
    await expect(remove("inconnu")).resolves.toEqual({
      status: "error",
      message: "Cet accès n'existe plus.",
    });
  });

  test("ferme les sessions et annule les demandes de compte joint en attente", async () => {
    const alice = await prisma.user.findUniqueOrThrow({
      where: { email: "alice@mt-finance.test" },
    });
    const account = await prisma.account.create({
      data: { name: "x", type: "CHECKING", scope: "PERSONAL" },
    });
    const expiresAt = new Date(Date.now() + 60_000);
    await prisma.jointAccountRequest.createMany({
      data: [
        {
          accountId: account.id,
          requesterId: alice.id,
          inviteeEmail: "carol@mt-finance.test",
          tagOwner: "REQUESTER",
          expiresAt,
        },
        {
          accountId: account.id,
          requesterId: (
            await prisma.user.findUniqueOrThrow({ where: { email: "admin@mt-finance.test" } })
          ).id,
          inviteeEmail: alice.email,
          tagOwner: "REQUESTER",
          expiresAt,
        },
      ],
    });
    const entry = await prisma.allowedEmail.findUniqueOrThrow({ where: { email: alice.email } });

    await expect(remove(entry.id)).resolves.toMatchObject({ status: "success" });

    expect(await prisma.session.count({ where: { userId: alice.id } })).toBe(0);
    const statuses = await prisma.jointAccountRequest.findMany({ select: { status: true } });
    expect(statuses.map((request) => request.status)).toEqual(["CANCELLED", "CANCELLED"]);
  });
});
