import { NextRequest } from "next/server";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp";
import { ThemeProvider } from "@/providers/theme-provider";
import { config, proxy } from "@/proxy";

/** Valeur d'une directive de la politique. */
const directive = (policy: string, name: string) =>
  policy.split("; ").find((entry) => entry === name || entry.startsWith(`${name} `));

const production = { nonce: "abc", isDevelopment: false, isHttps: true };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("politique de production", () => {
  const policy = buildContentSecurityPolicy(production);

  test("n'exécute que les scripts porteurs du jeton", () => {
    expect(directive(policy, "script-src")).toBe("script-src 'self' 'nonce-abc' 'strict-dynamic'");
  });

  test("n'accepte que les balises de style porteuses du jeton", () => {
    expect(directive(policy, "style-src")).toBe("style-src 'self' 'nonce-abc'");
  });

  test.each([
    "default-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ])("contient « %s »", (expected) => {
    expect(policy.split("; ")).toContain(expected);
  });

  test("n'autorise l'insertion en ligne que pour les attributs de style", () => {
    const inline = policy.split("; ").filter((entry) => entry.includes("'unsafe-inline'"));

    expect(inline).toEqual(["style-src-attr 'unsafe-inline'"]);
    expect(policy).not.toContain("'unsafe-eval'");
  });
});

describe("adaptations", () => {
  test("assouplit les règles en développement seulement", () => {
    const policy = buildContentSecurityPolicy({ ...production, isDevelopment: true });

    expect(directive(policy, "script-src")).toContain("'unsafe-eval'");
    expect(directive(policy, "style-src")).toBe("style-src 'self' 'unsafe-inline'");
  });

  test("ne force pas HTTPS sur un essai local", () => {
    const policy = buildContentSecurityPolicy({ ...production, isHttps: false });

    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  test("tire un jeton différent à chaque fois", () => {
    const nonces = new Set(Array.from({ length: 20 }, createNonce));

    expect(nonces.size).toBe(20);
    expect([...nonces][0]).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe("proxy", () => {
  /** Jeton annoncé par la politique d'une réponse. */
  const nonceOf = (policy: string | null) => /'nonce-([^']+)'/.exec(policy ?? "")?.[1];

  test("pose la même politique sur la réponse et transmet son jeton au rendu", () => {
    const response = proxy(new NextRequest("https://finance.exemple.fr/comptes"));
    const policy = response.headers.get("Content-Security-Policy");

    expect(policy).toContain("upgrade-insecure-requests");
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe(nonceOf(policy));
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
  });

  test("change de jeton à chaque requête et suit l'environnement", () => {
    vi.stubEnv("NODE_ENV", "development");
    const request = () => proxy(new NextRequest("http://localhost:3000/"));
    const first = request().headers.get("Content-Security-Policy");
    const second = request().headers.get("Content-Security-Policy");

    expect(first).toContain("'unsafe-eval'");
    expect(first).not.toContain("upgrade-insecure-requests");
    expect(nonceOf(first)).not.toBe(nonceOf(second));
  });

  test.each([
    ["/", true],
    ["/comptes", true],
    ["/login", true],
    ["/api/auth/get-session", false],
    ["/_next/static/chunk.js", false],
    ["/favicon.ico", false],
  ])("s'applique à %s : %s", (path, expected) => {
    const pattern = new RegExp(`^${config.matcher[0]?.source}$`);

    expect(pattern.test(path)).toBe(expected);
  });
});

describe("script du thème", () => {
  test("porte le jeton dans la page envoyée par le serveur", () => {
    const html = renderToString(<ThemeProvider nonce="jeton-theme">contenu</ThemeProvider>);

    expect(html).toMatch(/<script[^>]*nonce="jeton-theme"/);
  });
});
