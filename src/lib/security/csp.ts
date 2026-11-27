/** Politique de sécurité du contenu (CSP) des pages de l'application. */

export interface ContentSecurityPolicyOptions {
  /** Jeton unique à la requête, porté par les scripts autorisés. */
  nonce: string;
  isDevelopment: boolean;
  isHttps: boolean;
}

/** Jeton imprévisible, différent à chaque requête. */
export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/** Construit la valeur de l'en-tête `Content-Security-Policy`. */
export function buildContentSecurityPolicy({
  nonce,
  isDevelopment,
  isHttps,
}: ContentSecurityPolicyOptions): string {
  const directives = [
    "default-src 'self'",
    // Seuls les scripts porteurs du jeton, et ceux qu'ils chargent, s'exécutent.
    // React a besoin de `unsafe-eval` en développement uniquement.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    // En développement, le rechargement à chaud injecte des styles sans jeton.
    `style-src 'self' ${isDevelopment ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // Des composants d'interface utilisent l'attribut `style`, qui ne peut pas
    // porter de jeton. Les balises <style> restent soumises à la règle précédente.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Sans HTTPS (essai local), cette règle empêcherait le chargement.
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}
