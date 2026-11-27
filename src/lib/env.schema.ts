import { z } from "zod";

/** Une variable laissée vide dans `.env` équivaut à une variable absente. */
const optionalValue = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

const envSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .trim()
      .regex(/^(file:|libsql:\/\/|https:\/\/)/, "doit commencer par file:, libsql:// ou https://"),
    DATABASE_AUTH_TOKEN: optionalValue,
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, "doit contenir 64 caractères hexadécimaux (32 octets)"),
    ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email("doit être une adresse email")),
    BETTER_AUTH_SECRET: z.string().min(32, "doit contenir au moins 32 caractères"),
    BETTER_AUTH_URL: z.url({ protocol: /^https?$/, error: "doit être une URL http(s)" }),
    GITHUB_CLIENT_ID: optionalValue,
    GITHUB_CLIENT_SECRET: optionalValue,
    GOOGLE_CLIENT_ID: optionalValue,
    GOOGLE_CLIENT_SECRET: optionalValue,
    /** Définie automatiquement par Vercel. */
    VERCEL: optionalValue,
  })
  .superRefine((env, context) => {
    const report = (path: string, message: string) => {
      context.addIssue({ code: "custom", path: [path], message });
    };

    const isLocalDatabase = env.DATABASE_URL.startsWith("file:");
    if (!isLocalDatabase && !env.DATABASE_AUTH_TOKEN) {
      report("DATABASE_AUTH_TOKEN", "est obligatoire pour une base distante");
    }
    if (isLocalDatabase && env.VERCEL) {
      report("DATABASE_URL", "ne peut pas être un fichier local sur Vercel");
    }

    const authUrl = new URL(env.BETTER_AUTH_URL);
    if (authUrl.protocol !== "https:" && !LOCAL_HOSTNAMES.has(authUrl.hostname)) {
      report("BETTER_AUTH_URL", "doit utiliser https en dehors de la machine locale");
    }

    let configuredProviders = 0;
    for (const provider of ["GITHUB", "GOOGLE"] as const) {
      const id = env[`${provider}_CLIENT_ID`];
      const secret = env[`${provider}_CLIENT_SECRET`];
      if (id && secret) configuredProviders += 1;
      else if (id) report(`${provider}_CLIENT_SECRET`, "manque alors que l'identifiant est défini");
      else if (secret) report(`${provider}_CLIENT_ID`, "manque alors que le secret est défini");
    }
    if (configuredProviders === 0) {
      report("GITHUB_CLIENT_ID", "au moins un fournisseur OAuth (GitHub ou Google) est requis");
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Valide l'environnement. Les messages d'erreur ne contiennent aucune valeur. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const details = result.error.issues.map((issue) => {
    const name = String(issue.path[0] ?? "environnement");
    const isMissing = source[name] === undefined && issue.code !== "custom";
    return `  - ${name} : ${isMissing ? "variable manquante" : issue.message}`;
  });
  throw new Error(`Variables d'environnement invalides :\n${details.join("\n")}`);
}
