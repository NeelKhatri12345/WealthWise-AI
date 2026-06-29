import { z } from "zod";
import { emailSchema, passwordSchema, nameSchema, phoneSchema } from "@/utils/validation";
export const registerSchema = z
    .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
