import { z } from "zod";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const emailSchema = z
  .string({ error: "Adresse email requise." })
  .trim()
  .toLowerCase()
  .max(254, "Adresse email trop longue.")
  .pipe(z.email("Adresse email invalide."));
