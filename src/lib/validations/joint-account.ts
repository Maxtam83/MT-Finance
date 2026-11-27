import { z } from "zod";
import { TAG_OWNER_CHOICES } from "@/lib/joint-accounts/constants";
import { emailSchema } from "@/lib/validations/email";
import { idSchema } from "@/lib/validations/id";

export const requestJointAccountSchema = z.object({
  accountId: idSchema,
  inviteeEmail: emailSchema,
  tagOwner: z.enum(TAG_OWNER_CHOICES, { error: "Choisissez le référent des tags." }),
  // La personne qui envoie la demande donne aussi son accord explicite.
  consent: z.literal("on", { error: "Confirmez que vous acceptez de partager ce compte." }),
});

export const jointRequestIdSchema = z.object({
  requestId: idSchema,
});

export const jointAccountIdSchema = z.object({
  accountId: idSchema,
});
