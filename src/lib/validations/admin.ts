import { z } from "zod";
import { emailSchema } from "@/lib/validations/email";

const idSchema = z
  .string({ error: "Identifiant requis." })
  .trim()
  .min(1, "Identifiant requis.")
  .max(64, "Identifiant invalide.")
  .regex(/^[A-Za-z0-9_-]+$/, "Identifiant invalide.");

export const addAllowedEmailSchema = z.object({
  email: emailSchema,
});

export const removeAllowedEmailSchema = z.object({
  id: idSchema,
});

export const TAG_OWNER_CHOICES = ["CURRENT_OWNER", "NEW_MEMBER"] as const;

export const linkAccountMemberSchema = z.object({
  accountId: idSchema,
  email: emailSchema,
  tagOwner: z.enum(TAG_OWNER_CHOICES, { error: "Choisissez le référent des tags." }),
});
