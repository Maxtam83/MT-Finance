import { z } from "zod";
import { emailSchema } from "@/lib/validations/email";
import { idSchema } from "@/lib/validations/id";

export const addAllowedEmailSchema = z.object({
  email: emailSchema,
});

export const removeAllowedEmailSchema = z.object({
  id: idSchema,
});
