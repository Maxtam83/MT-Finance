/** Règles du compte joint, utilisables côté client et serveur. */

/** Un compte joint réunit exactement deux personnes. */
export const MAX_JOINT_ACCOUNT_MEMBERS = 2;

/** Durée de validité d'une demande, en jours. */
export const JOINT_REQUEST_TTL_DAYS = 7;

export const JOINT_REQUEST_STATUS = {
  pending: "PENDING",
  accepted: "ACCEPTED",
  declined: "DECLINED",
  cancelled: "CANCELLED",
} as const;

/** Personne dont les tags s'appliqueront au compte joint. */
export const TAG_OWNER_CHOICES = ["REQUESTER", "INVITEE"] as const;

export type TagOwnerChoice = (typeof TAG_OWNER_CHOICES)[number];
