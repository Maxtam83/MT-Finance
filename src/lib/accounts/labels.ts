const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: "Compte courant",
  PRO: "Compte professionnel",
  SAVINGS: "Épargne",
  PEA: "PEA",
  PEE: "PEE",
  CRYPTO: "Cryptoactifs",
};

/** Libellé français d'un type de compte ; la valeur brute s'il est inconnu. */
export function getAccountTypeLabel(type: string): string {
  return Object.hasOwn(ACCOUNT_TYPE_LABELS, type) ? (ACCOUNT_TYPE_LABELS[type] as string) : type;
}
