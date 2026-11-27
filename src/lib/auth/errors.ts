/** Codes renvoyés par nos contrôles d'accès. Utilisable côté client et serveur. */
export const ACCESS_ERROR = {
  emailNotAllowed: "EMAIL_NOT_ALLOWED",
  emailUnverified: "EMAIL_UNVERIFIED",
} as const;

export const ACCESS_ERROR_MESSAGES = {
  [ACCESS_ERROR.emailNotAllowed]:
    "Cette adresse email n'est pas autorisée à accéder à l'application. Demandez à l'administrateur de l'ajouter à la liste blanche.",
  [ACCESS_ERROR.emailUnverified]:
    "L'adresse email de ce compte n'est pas vérifiée chez le fournisseur de connexion.",
} as const;

const MESSAGES: Record<string, string> = {
  ...ACCESS_ERROR_MESSAGES,
  access_denied: "La connexion a été annulée.",
  account_not_linked:
    "Un compte existe déjà avec cette adresse email. Connectez-vous avec la méthode utilisée la première fois.",
  AUTH_CANCELLED: "La connexion par passkey a été annulée.",
  ERROR_CEREMONY_ABORTED: "L'opération sur la passkey a été annulée.",
  ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED: "Cet appareil possède déjà une passkey.",
  PASSKEY_NOT_FOUND: "Cette passkey n'est pas reconnue. Connectez-vous d'abord avec OAuth.",
  SESSION_NOT_FRESH:
    "Par sécurité, déconnectez-vous puis reconnectez-vous avant d'ajouter une passkey.",
};

export function getAuthErrorMessage(code: string | undefined): string {
  // `hasOwn` : le code vient de l'URL et ne doit pas atteindre le prototype.
  if (code && Object.hasOwn(MESSAGES, code)) {
    return MESSAGES[code] as string;
  }
  return "La connexion a échoué. Veuillez réessayer.";
}
