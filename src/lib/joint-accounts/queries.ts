import "server-only";
import { decrypt } from "@/lib/crypto";
import type { TagOwnerChoice } from "@/lib/joint-accounts/constants";
import { pendingRequestFilter } from "@/lib/joint-accounts/service";
import { prisma } from "@/lib/prisma";

/** Demande reçue : de quoi décider, sans aucun montant ni opération. */
export interface ReceivedRequest {
  id: string;
  requesterEmail: string;
  accountName: string;
  accountType: string;
  tagOwner: TagOwnerChoice;
  expiresAt: Date;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  isOwner: boolean;
  /** Renseigné quand le compte est joint. */
  joint: { sharedWith: string; tagOwner: string } | null;
  pendingRequest: { id: string; inviteeEmail: string; expiresAt: Date } | null;
}

/** Déchiffre un nom de compte sans faire échouer toute la page s'il est illisible. */
export function readAccountName(encryptedName: string): string {
  try {
    return decrypt(encryptedName);
  } catch {
    return "Nom illisible";
  }
}

/** Nombre de demandes à examiner par la personne connectée. */
export async function countReceivedRequests(email: string, now: Date = new Date()): Promise<number> {
  return prisma.jointAccountRequest.count({
    where: { inviteeEmail: email, ...pendingRequestFilter(now) },
  });
}

/** Demandes adressées à la personne connectée. */
export async function listReceivedRequests(
  email: string,
  now: Date = new Date(),
): Promise<ReceivedRequest[]> {
  const requests = await prisma.jointAccountRequest.findMany({
    where: { inviteeEmail: email, ...pendingRequestFilter(now) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      tagOwner: true,
      expiresAt: true,
      requester: { select: { email: true } },
      account: { select: { name: true, type: true } },
    },
  });

  return requests.map(({ id, tagOwner, expiresAt, requester, account }) => ({
    id,
    expiresAt,
    tagOwner: tagOwner === "INVITEE" ? "INVITEE" : "REQUESTER",
    requesterEmail: requester.email,
    accountName: readAccountName(account.name),
    accountType: account.type,
  }));
}

/** Comptes dont la personne connectée est membre. */
export async function listAccountSummaries(
  userId: string,
  now: Date = new Date(),
): Promise<AccountSummary[]> {
  const accounts = await prisma.account.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      tagOwnerId: true,
      members: { select: { userId: true, role: true, user: { select: { email: true } } } },
      jointRequests: {
        // Une demande n'est visible ici que par la personne qui l'a envoyée.
        where: { requesterId: userId, ...pendingRequestFilter(now) },
        select: { id: true, inviteeEmail: true, expiresAt: true },
        take: 1,
      },
    },
  });

  return accounts.map((account) => {
    const other = account.members.find((member) => member.userId !== userId);
    const tagOwner = account.members.find((member) => member.userId === account.tagOwnerId);

    return {
      id: account.id,
      name: readAccountName(account.name),
      type: account.type,
      isOwner: account.members.some(
        (member) => member.userId === userId && member.role === "OWNER",
      ),
      joint: other
        ? {
            sharedWith: other.user.email,
            tagOwner: !tagOwner
              ? "À désigner"
              : tagOwner.userId === userId
                ? "Vous"
                : tagOwner.user.email,
          }
        : null,
      pendingRequest: account.jointRequests[0] ?? null,
    };
  });
}
