import { afterEach, describe, expect, test, vi } from "vitest";
import manifest from "@/app/manifest";
import { setTestEnv } from "../helpers/env";
import nextConfig from "../../next.config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("configuration Next.js", () => {
  test("pose les en-têtes de sécurité sur toutes les routes", async () => {
    const [rule] = (await nextConfig.headers?.()) ?? [];

    expect(rule?.source).toBe("/:path*");
    expect(rule?.headers).toEqual(
      expect.arrayContaining([
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ]),
    );
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  test("interdit à l'API de charger ou d'exécuter quoi que ce soit", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];

    expect(rules.find((rule) => rule.source === "/api/:path*")?.headers).toEqual([
      { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" },
    ]);
  });
});

describe("manifeste PWA", () => {
  test("déclare une application autonome avec ses icônes", () => {
    const result = manifest();

    expect(result.display).toBe("standalone");
    expect(result.icons).toHaveLength(3);
    expect(result.theme_color).toBe("#06090d");
  });
});

describe("configuration Prisma", () => {
  test.each([
    ["file:./autre.db", "file:./autre.db"],
    ["libsql://production.turso.io", "file:./dev.db"],
    [undefined, "file:./dev.db"],
  ])("avec %s, le CLI travaille sur %s", async (databaseUrl, expected) => {
    vi.doMock("dotenv/config", () => ({}));
    vi.stubEnv("DATABASE_URL", databaseUrl);

    const { default: config } = await import("../../prisma.config");

    expect(config.datasource?.url).toBe(expected);
  });
});

describe("démarrage du serveur", () => {
  test("valide l'environnement sur le runtime Node.js", async () => {
    setTestEnv();
    const { register } = await import("@/instrumentation");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    await expect(register()).resolves.toBeUndefined();

    vi.stubEnv("ENCRYPTION_KEY", "invalide");
    await expect(register()).rejects.toThrow("ENCRYPTION_KEY");
  });

  test("ne fait rien sur un autre runtime", async () => {
    const { register } = await import("@/instrumentation");
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("ENCRYPTION_KEY", "invalide");

    await expect(register()).resolves.toBeUndefined();
  });
});

describe("client Prisma et environnement", () => {
  test("lit l'environnement une seule fois", async () => {
    setTestEnv();
    const { getEnv } = await import("@/lib/env");

    expect(getEnv()).toBe(getEnv());
  });

  test("ne conserve pas de client global en production", async () => {
    setTestEnv();
    vi.stubEnv("NODE_ENV", "production");
    const holder = globalThis as { prisma?: unknown };
    delete holder.prisma;

    const { prisma } = await import("@/lib/prisma");

    expect(holder.prisma).toBeUndefined();
    await prisma.$disconnect();
  });

  test("réutilise le client entre deux chargements en développement", async () => {
    setTestEnv();
    const first = await import("@/lib/prisma");
    vi.resetModules();
    const second = await import("@/lib/prisma");

    expect(second.prisma).toBe(first.prisma);
    await first.prisma.$disconnect();
    delete (globalThis as { prisma?: unknown }).prisma;
  });
});
