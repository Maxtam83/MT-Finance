/**
 * Point d'entrée de l'envoi des migrations vers Turso.
 *
 * Usage :
 *   npm run db:deploy:turso                 applique les migrations
 *   npm run db:deploy:turso:check           liste les migrations en attente
 *
 * La logique et ses garanties sont décrites dans `lib/migrations.ts`.
 */
import { runDeployCli } from "./lib/migrations.ts";

process.exitCode = await runDeployCli(process.argv.slice(2), process.env, console);
