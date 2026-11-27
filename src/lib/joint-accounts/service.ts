import "server-only";
import type { ActionState } from "@/actions/action-state";
import type { Prisma } from "@/generated/prisma/client";
import { isEmailAllowed } from "@/lib/auth/whitelist";
import {
  JOINT_REQUEST_STATUS,
  JOINT_REQUEST_TTL_DAYS,
  MAX_JOINT_ACCOUNT_MEMBERS,
} from "@/lib/joint-accounts/constants";
import type { TagOwnerChoice } from "@/lib/joint-accounts/constants";
import { prisma } from "@/lib/prisma";

/*
 * Un compte ne devient joint qu'avec l'accord des deux personnes, chacune depuis
 * sa propre session. Aucune de ces fonctions ne lit de montant ni d'opération.
 */

/** Personne connectée qui agit. Son identité vient toujours de la session. */
export interface Actor {
  id: string;
  email: string;
}

export interface JointRequestInput {
  accountId: string;
  inviteeEmail: string;
  tagOwner: TagOwnerChoice;
}

const REQUEST_UNAVAILABLE = "Demande introuvable, expirée ou déjà traitée.";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Refus métier levé dans une transaction pour l'annuler entièrement. */
class Refusal extends Error {}

/** Construit un résultat d'échec. */
function failure(message: string): ActionState {
  return { status: "error", message };
}

/** Critère d'une demande encore en attente à l'instant donné. */
export function pendingRequestFilter(now: Date) {
  return { status: JOINT_REQUEST_STATUS.pending, expiresAt: { gt: now } };
}

/** Exécute une transaction ; un `Refusal` l'annule et devient un message d'erreur. */
async function runGuarded(
  work: (tx: Prisma.TransactionClient) => Promise<string>,
): Promise<ActionState> {
  try {
    return { status: "success", message: await prisma.$transaction(work) };
  } catch (error) {
    if (error instanceof Refusal) return failure(error.message);
    throw error;
  }
}

/** Première validation : le propriétaire propose de partager son compte. */
export async function createJointRequest(
  requester: Actor,
  input: JointRequestInput,
  now: Date = new Date(),
): Promise<ActionState> {
  if (input.inviteeEmail === requester.email) {
    return failure("Vous ne pouvez pas vous inviter vous-même.");
  }

  return runGuarded(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: input.accountId, members: { some: { userId: requester.id, role: "OWNER" } } },
      select: { _count: { select: { members: true } } },
    });
    // Même message pour un compte inexistant ou appartenant à quelqu'un d'autre.
    if (!account) throw new Refusal("Compte introuvable.");
    if (account._count.members >= MAX_JOINT_ACCOUNT_MEMBERS) {
      throw new Refusal("Ce compte est déjà un compte joint.");
    }

    const pending = await tx.jointAccountRequest.count({
      where: { accountId: input.accountId, ...pendingRequestFilter(now) },
    });
    if (pending > 0) {
      throw new Refusal(
        "Une demande est déjà en attente pour ce compte. Annulez-la avant d'en envoyer une autre.",
      );
    }

    await tx.jointAccountRequest.create({
      data: {
        ...input,
        requesterId: requester.id,
        expiresAt: new Date(now.getTime() + JOINT_REQUEST_TTL_DAYS * DAY_IN_MS),
      },
      select: { id: true },
    });

    // Réponse identique que l'adresse soit inscrite ou non : rien ne révèle qui
    // utilise l'application.
    return `Demande enregistrée. La personne la verra en se connectant avec cette adresse ; elle expire dans ${JOINT_REQUEST_TTL_DAYS} jours.`;
  });
}

/** Seconde validation : la personne invitée accepte depuis sa propre session. */
export async function acceptJointRequest(
  invitee: Actor,
  requestId: string,
  now: Date = new Date(),
): Promise<ActionState> {
  // Seule l'adresse de la session peut consommer la demande.
  const ownRequest = { id: requestId, inviteeEmail: invitee.email, ...pendingRequestFilter(now) };

  const request = await prisma.jointAccountRequest.findFirst({
    where: ownRequest,
    select: { requester: { select: { email: true } } },
  });
  if (!request) return failure(REQUEST_UNAVAILABLE);
  // La personne qui invite doit toujours être autorisée au moment de la validation.
  if (!(await isEmailAllowed(request.requester.email))) return failure(REQUEST_UNAVAILABLE);

  return runGuarded(async (tx) => {
    // L'écriture ouvre la transaction : la demande ne peut être consommée qu'une fois.
    const claimed = await tx.jointAccountRequest.updateMany({
      where: ownRequest,
      data: { status: JOINT_REQUEST_STATUS.accepted, resolvedAt: now },
    });
    if (claimed.count !== 1) throw new Refusal(REQUEST_UNAVAILABLE);

    const { accountId, requesterId, tagOwner } =
      await tx.jointAccountRequest.findUniqueOrThrow({
        where: { id: requestId },
        select: { accountId: true, requesterId: true, tagOwner: true },
      });

    // La situation du compte a pu changer depuis l'envoi : il doit encore
    // appartenir à la seule personne qui invite.
    const members = await tx.accountMember.findMany({
      where: { accountId },
      select: { userId: true, role: true },
    });
    const [owner, ...others] = members;
    if (owner?.userId !== requesterId || owner.role !== "OWNER" || others.length > 0) {
      throw new Refusal("Ce compte ne peut plus être partagé.");
    }

    await tx.accountMember.create({
      data: { accountId, userId: invitee.id, role: "MEMBER" },
      select: { id: true },
    });
    const referentId = tagOwner === "INVITEE" ? invitee.id : requesterId;
    // `updateMany` ne renvoie qu'un nombre : aucun champ du compte n'est lu.
    await tx.account.updateMany({ where: { id: accountId }, data: { tagOwnerId: referentId } });
    // Les tags sont privés : ceux de l'autre personne ne doivent pas devenir
    // visibles avec l'historique. Les tags eux-mêmes sont conservés.
    await tx.transaction.updateMany({
      where: { accountId, tag: { userId: { not: referentId } } },
      data: { tagId: null },
    });
    // Plus aucune autre demande ne doit rester ouverte sur ce compte.
    await tx.jointAccountRequest.updateMany({
      where: { accountId, status: JOINT_REQUEST_STATUS.pending },
      data: { status: JOINT_REQUEST_STATUS.cancelled, resolvedAt: now },
    });

    return "Compte joint activé : les deux personnes ont validé.";
  });
}

/** La personne invitée refuse la demande. */
export async function declineJointRequest(
  invitee: Actor,
  requestId: string,
  now: Date = new Date(),
): Promise<ActionState> {
  const { count } = await prisma.jointAccountRequest.updateMany({
    where: { id: requestId, inviteeEmail: invitee.email, ...pendingRequestFilter(now) },
    data: { status: JOINT_REQUEST_STATUS.declined, resolvedAt: now },
  });
  return count === 1 ? { status: "success", message: "Demande refusée." } : failure(REQUEST_UNAVAILABLE);
}

/** La personne qui a envoyé la demande la retire. */
export async function cancelJointRequest(
  requester: Actor,
  requestId: string,
  now: Date = new Date(),
): Promise<ActionState> {
  const { count } = await prisma.jointAccountRequest.updateMany({
    where: { id: requestId, requesterId: requester.id, status: JOINT_REQUEST_STATUS.pending },
    data: { status: JOINT_REQUEST_STATUS.cancelled, resolvedAt: now },
  });
  return count === 1 ? { status: "success", message: "Demande annulée." } : failure(REQUEST_UNAVAILABLE);
}

/**
 * Annule les demandes envoyées ou reçues par une adresse dont l'accès est retiré.
 * La requête n'est pas attendue ici, pour pouvoir rejoindre une transaction.
 */
export function cancelRequestsInvolving(email: string, now: Date = new Date()) {
  return prisma.jointAccountRequest.updateMany({
    where: {
      status: JOINT_REQUEST_STATUS.pending,
      OR: [{ inviteeEmail: email }, { requester: { email } }],
    },
    data: { status: JOINT_REQUEST_STATUS.cancelled, resolvedAt: now },
  });
}
