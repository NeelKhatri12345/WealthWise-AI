import { z } from "zod";
import { nameSchema, phoneSchema } from "@/utils/validation";

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  avatar: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
