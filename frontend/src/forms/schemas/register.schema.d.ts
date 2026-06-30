import { z } from "zod";
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
}, {
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
}>, {
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
}, {
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
}>;
export type RegisterFormData = z.infer<typeof registerSchema>;
