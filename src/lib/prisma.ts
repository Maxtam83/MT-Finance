import "server-only";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

/** Crée le client Prisma branché sur libSQL. */
function createPrismaClient(): PrismaClient {
  const { DATABASE_URL, DATABASE_AUTH_TOKEN } = getEnv();
  const adapter = new PrismaLibSql({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN });
  return new PrismaClient({ adapter });
}

// Réutilise le client entre les rechargements à chaud en développement.
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
