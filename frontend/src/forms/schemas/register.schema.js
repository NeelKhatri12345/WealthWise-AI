import { z } from "zod";
import { emailSchema, nameSchema, passwordSchema } from "@/utils/validation";
export const registerSchema = z
    .object({
    fullName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
