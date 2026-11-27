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
const { encrypt } = await import("@/lib/crypto");
const { prisma } = await import("@/lib/prisma");
const service = await import("@/lib/joint-accounts/service");
const queries = await import("@/lib/joint-accounts/queries");
const actions = await import("@/actions/joint-accounts");

interface Person {
  id: string;
  email: string;
  cookie: string;
}

const people = {} as Record<"admin" | "alice" | "mallory", Person>;
const ACCOUNT_ID = "compte-test";
const NEXT_MONTH = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

/** Envoie une demande au nom d'alice. */
const invite = (inviteeEmail = people.mallory.email, tagOwner: "REQUESTER" | "INVITEE" = "REQUESTER") =>
  service.createJointRequest(people.alice, { accountId: ACCOUNT_ID, inviteeEmail, tagOwner });

/** Identifiant de la dernière demande créée. */
const lastRequestId = async () =>
  (await prisma.jointAccountRequest.findFirstOrThrow({ orderBy: { createdAt: "desc" } })).id;

/** Nombre de membres du compte de test. */
const memberCount = () => prisma.accountMember.count({ where: { accountId: ACCOUNT_ID } });

beforeAll(async () => {
  mockGitHub();
  await prisma.allowedEmail.createMany({
    data: [
      { email: "alice@mt-finance.test", addedBy: "test" },
      { email: "mallory@mt-finance.test", addedBy: "test" },
    ],
  });
  for (const name of ["admin", "alice", "mallory"] as const) {
    const { cookie } = await signInWithGitHub(auth, name);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: `${name}@mt-finance.test` },
    });
    people[name] = { id: user.id, email: user.email, cookie };
  }
});

beforeEach(async () => {
  requestState.cookie = "";
  revalidatePath.mockClear();
  await prisma.account.deleteMany();
  await prisma.account.create({
    data: {
      id: ACCOUNT_ID,
      name: encrypt("Compte commun"),
      type: "CHECKING",
      scope: "PERSONAL",
      members: { create: { userId: people.alice.id, role: "OWNER" } },
    },
  });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await prisma.$disconnect();
  await database.remove();
});

describe("envoi d'une demande", () => {
  test("ne partage rien tant que la seconde personne n'a pas validé", async () => {
    await expect(invite()).resolves.toMatchObject({ status: "success" });

    expect(await memberCount()).toBe(1);
  });

  test("répond de la même façon que l'adresse soit inscrite ou non", async () => {
    const registered = await invite(people.mallory.email);
    await prisma.jointAccountRequest.deleteMany();
    const unknown = await invite("personne@mt-finance.test");

    expect(unknown).toEqual(registered);
  });

  test("refuse de s'inviter soi-même", async () => {
    await expect(invite(people.alice.email)).resolves.toEqual({
      status: "error",
      message: "Vous ne pouvez pas vous inviter vous-même.",
    });
  });

  test.each([
    ["le compte d'une autre personne", ACCOUNT_ID, "admin" as const],
    ["un compte inexistant", "inconnu", "alice" as const],
  ])("refuse %s avec le même message", async (_label, accountId, who) => {
    await expect(
      service.createJointRequest(people[who], {
        accountId,
        inviteeEmail: people.mallory.email,
        tagOwner: "REQUESTER",
      }),
    ).resolves.toEqual({ status: "error", message: "Compte introuvable." });
  });

  test("refuse un simple membre", async () => {
    await prisma.accountMember.updateMany({ data: { role: "MEMBER" } });

    await expect(invite()).resolves.toMatchObject({ message: "Compte introuvable." });
  });

  test("refuse un compte déjà joint", async () => {
    await prisma.accountMember.create({
      data: { accountId: ACCOUNT_ID, userId: people.admin.id, role: "MEMBER" },
    });

    await expect(invite()).resolves.toMatchObject({ message: "Ce compte est déjà un compte joint." });
  });

  test("n'autorise qu'une demande en attente par compte, sauf si elle a expiré", async () => {
    await invite();
    await expect(invite("autre@mt-finance.test")).resolves.toMatchObject({ status: "error" });

    await prisma.jointAccountRequest.updateMany({ data: { expiresAt: new Date(0) } });
    await expect(invite("autre@mt-finance.test")).resolves.toMatchObject({ status: "success" });
  });

  test("laisse remonter une erreur inattendue", async () => {
    const spy = vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("panne"));

    await expect(invite()).rejects.toThrow("panne");
    spy.mockRestore();
  });
});

describe("validation par la personne invitée", () => {
  test.each([
    ["REQUESTER" as const, "alice" as const],
    ["INVITEE" as const, "mallory" as const],
  ])("active le compte joint, référent « %s »", async (tagOwner, referent) => {
    await invite(people.mallory.email, tagOwner);
    const requestId = await lastRequestId();

    await expect(service.acceptJointRequest(people.mallory, requestId)).resolves.toEqual({
      status: "success",
      message: "Compte joint activé : les deux personnes ont validé.",
    });

    expect(await memberCount()).toBe(2);
    const account = await prisma.account.findUniqueOrThrow({ where: { id: ACCOUNT_ID } });
    expect(account.tagOwnerId).toBe(people[referent].id);
  });

  test("est impossible pour toute autre personne, y compris l'auteur et l'administrateur", async () => {
    await invite();
    const requestId = await lastRequestId();

    for (const intruder of [people.alice, people.admin]) {
      await expect(service.acceptJointRequest(intruder, requestId)).resolves.toMatchObject({
        status: "error",
      });
    }
    expect(await memberCount()).toBe(1);
  });

  test("est impossible après expiration", async () => {
    await invite();

    await expect(
      service.acceptJointRequest(people.mallory, await lastRequestId(), NEXT_MONTH),
    ).resolves.toMatchObject({ status: "error" });
    expect(await memberCount()).toBe(1);
  });

  test("est impossible si l'auteur n'est plus autorisé", async () => {
    await invite();
    const where = { email: people.alice.email };
    await prisma.allowedEmail.delete({ where });

    await expect(
      service.acceptJointRequest(people.mallory, await lastRequestId()),
    ).resolves.toMatchObject({ status: "error" });

    await prisma.allowedEmail.create({ data: { ...where, addedBy: "test" } });
    expect(await memberCount()).toBe(1);
  });

  test.each([
    [
      "l'auteur n'est plus propriétaire",
      () => prisma.accountMember.updateMany({ data: { role: "MEMBER" } }),
    ],
    [
      "le propriétaire a changé",
      () => prisma.accountMember.updateMany({ data: { userId: people.admin.id } }),
    ],
    [
      "le compte a déjà un second membre",
      () =>
        prisma.accountMember.create({
          data: { accountId: ACCOUNT_ID, userId: people.admin.id, role: "MEMBER" },
        }),
    ],
    ["le compte n'a plus de membre", () => prisma.accountMember.deleteMany()],
  ])("est annulée en entier si %s", async (_label, change) => {
    await invite();
    const requestId = await lastRequestId();
    await change();
    const before = await memberCount();

    await expect(service.acceptJointRequest(people.mallory, requestId)).resolves.toEqual({
      status: "error",
      message: "Ce compte ne peut plus être partagé.",
    });

    // La transaction annulée laisse la demande intacte.
    const request = await prisma.jointAccountRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    expect(request.status).toBe("PENDING");
    expect(await memberCount()).toBe(before);
  });

  test("ne peut servir qu'une fois, même en parallèle", async () => {
    await invite();
    const requestId = await lastRequestId();

    const results = await Promise.all([
      service.acceptJointRequest(people.mallory, requestId),
      service.acceptJointRequest(people.mallory, requestId),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(["error", "success"]);
    expect(await memberCount()).toBe(2);
  });
});

describe("refus et annulation", () => {
  test("seule la personne invitée peut refuser, une seule fois", async () => {
    await invite();
    const requestId = await lastRequestId();

    await expect(service.declineJointRequest(people.alice, requestId)).resolves.toMatchObject({
      status: "error",
    });
    await expect(service.declineJointRequest(people.mallory, requestId)).resolves.toEqual({
      status: "success",
      message: "Demande refusée.",
    });
    await expect(service.acceptJointRequest(people.mallory, requestId)).resolves.toMatchObject({
      status: "error",
    });
    expect(await memberCount()).toBe(1);
  });

  test("seul l'auteur peut annuler, une seule fois", async () => {
    await invite();
    const requestId = await lastRequestId();

    await expect(service.cancelJointRequest(people.mallory, requestId)).resolves.toMatchObject({
      status: "error",
    });
    await expect(service.cancelJointRequest(people.alice, requestId)).resolves.toEqual({
      status: "success",
      message: "Demande annulée.",
    });
    await expect(service.cancelJointRequest(people.alice, requestId)).resolves.toMatchObject({
      status: "error",
    });
    await expect(service.acceptJointRequest(people.mallory, requestId)).resolves.toMatchObject({
      status: "error",
    });
  });
});

describe("lectures", () => {
  test("montre à la personne invitée de quoi décider, sans aucun montant", async () => {
    await invite(people.mallory.email, "INVITEE");

    expect(await queries.countReceivedRequests(people.mallory.email)).toBe(1);
    const [request] = await queries.listReceivedRequests(people.mallory.email);
    expect(request).toMatchObject({
      requesterEmail: people.alice.email,
      accountName: "Compte commun",
      accountType: "CHECKING",
      tagOwner: "INVITEE",
    });
    expect(Object.keys(request ?? {})).not.toContain("initialBalance");
  });

  test("ne montre rien aux autres personnes, ni après expiration", async () => {
    await invite();

    expect(await queries.listReceivedRequests(people.admin.email)).toEqual([]);
    expect(await queries.listReceivedRequests(people.mallory.email, NEXT_MONTH)).toEqual([]);
    expect(await queries.countReceivedRequests(people.mallory.email, NEXT_MONTH)).toBe(0);
  });

  test("décrit un compte personnel avec sa demande en attente", async () => {
    await invite(people.mallory.email, "REQUESTER");

    const [summary] = await queries.listAccountSummaries(people.alice.id);

    expect(summary).toMatchObject({
      name: "Compte commun",
      isOwner: true,
      joint: null,
      pendingRequest: { inviteeEmail: people.mallory.email },
    });
    expect((await queries.listReceivedRequests(people.mallory.email))[0]?.tagOwner).toBe(
      "REQUESTER",
    );
    expect(await queries.listAccountSummaries(people.mallory.id)).toEqual([]);
  });

  test("décrit le référent des tags du point de vue de chacun", async () => {
    await invite();
    await service.acceptJointRequest(people.mallory, await lastRequestId());

    const [mine] = await queries.listAccountSummaries(people.alice.id);
    const [theirs] = await queries.listAccountSummaries(people.mallory.id);

    expect(mine?.joint).toEqual({ sharedWith: people.mallory.email, tagOwner: "Vous" });
    expect(theirs).toMatchObject({
      isOwner: false,
      pendingRequest: null,
      joint: { sharedWith: people.alice.email, tagOwner: people.alice.email },
    });

    await prisma.account.update({ where: { id: ACCOUNT_ID }, data: { tagOwnerId: null } });
    const [orphan] = await queries.listAccountSummaries(people.alice.id);
    expect(orphan?.joint?.tagOwner).toBe("À désigner");
  });

  test("n'échoue pas sur un nom de compte illisible", () => {
    expect(queries.readAccountName("illisible")).toBe("Nom illisible");
  });
});

describe("Server Actions", () => {
  /** Formulaire de demande complet, avec d'éventuels remplacements. */
  const requestForm = (overrides: Record<string, string> = {}) =>
    formData({
      accountId: ACCOUNT_ID,
      inviteeEmail: "Mallory@MT-Finance.test",
      tagOwner: "REQUESTER",
      consent: "on",
      ...overrides,
    });

  test("refusent un appel anonyme", async () => {
    const redirect = new RedirectSignal("/login");
    const form = formData({ requestId: "x" });

    await expect(actions.requestJointAccount(initialActionState, requestForm())).rejects.toEqual(redirect);
    await expect(actions.acceptJointAccountRequest(initialActionState, form)).rejects.toEqual(redirect);
    await expect(actions.declineJointAccountRequest(initialActionState, form)).rejects.toEqual(redirect);
    await expect(actions.cancelJointAccountRequest(initialActionState, form)).rejects.toEqual(redirect);
    expect(await prisma.jointAccountRequest.count()).toBe(0);
  });

  test.each([
    [{ consent: "" }, "Confirmez que vous acceptez de partager ce compte."],
    [{ inviteeEmail: "x" }, "Adresse email invalide."],
    [{ tagOwner: "ADMIN" }, "Choisissez le référent des tags."],
    [{ accountId: "a b" }, "Identifiant invalide."],
  ])("valident la saisie %o", async (override, message) => {
    requestState.cookie = people.alice.cookie;

    await expect(
      actions.requestJointAccount(initialActionState, requestForm(override)),
    ).resolves.toEqual({ status: "error", message });
  });

  test("enchaînent demande et validation avec les sessions des deux personnes", async () => {
    requestState.cookie = people.alice.cookie;
    await expect(
      actions.requestJointAccount(initialActionState, requestForm()),
    ).resolves.toMatchObject({ status: "success" });

    requestState.cookie = people.mallory.cookie;
    const form = formData({ requestId: await lastRequestId() });
    await expect(actions.acceptJointAccountRequest(initialActionState, form)).resolves.toMatchObject({
      status: "success",
    });

    expect(await memberCount()).toBe(2);
    expect(revalidatePath).toHaveBeenCalledWith("/comptes");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  test("appliquent le refus et l'annulation", async () => {
    await invite();
    requestState.cookie = people.mallory.cookie;
    const first = formData({ requestId: await lastRequestId() });
    await expect(actions.declineJointAccountRequest(initialActionState, first)).resolves.toMatchObject({
      status: "success",
    });

    await prisma.jointAccountRequest.deleteMany();
    await invite();
    requestState.cookie = people.alice.cookie;
    const second = formData({ requestId: await lastRequestId() });
    await expect(actions.cancelJointAccountRequest(initialActionState, second)).resolves.toMatchObject({
      status: "success",
    });
  });

  test("refusent un identifiant de demande mal formé", async () => {
    requestState.cookie = people.mallory.cookie;

    await expect(
      actions.acceptJointAccountRequest(initialActionState, formData({ requestId: "../x" })),
    ).resolves.toEqual({ status: "error", message: "Identifiant invalide." });
  });
});
