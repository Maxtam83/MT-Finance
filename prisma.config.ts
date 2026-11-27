import "dotenv/config";
import { defineConfig } from "prisma/config";

const LOCAL_DATABASE_URL = "file:./dev.db";

// Le CLI Prisma ne travaille QUE sur un fichier SQLite local, même si
// DATABASE_URL pointe vers Turso : cela évite toute action accidentelle sur la
// production. Les migrations sont envoyées vers Turso par scripts/db-deploy.ts.
const databaseUrl = process.env.DATABASE_URL?.startsWith("file:")
  ? process.env.DATABASE_URL
  : LOCAL_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
