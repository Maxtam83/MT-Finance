import { z } from "zod";

/** Identifiant technique reçu d'un formulaire. */
export const idSchema = z
  .string({ error: "Identifiant requis." })
  .trim()
  .min(1, "Identifiant requis.")
  .max(64, "Identifiant invalide.")
  .regex(/^[A-Za-z0-9_-]+$/, "Identifiant invalide.");
