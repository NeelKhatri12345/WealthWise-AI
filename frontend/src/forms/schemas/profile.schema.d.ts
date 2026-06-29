import { z } from "zod";
export declare const profileSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    avatar: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    avatar?: string | undefined;
    phone?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    avatar?: string | undefined;
    phone?: string | undefined;
}>;
export type ProfileFormData = z.infer<typeof profileSchema>;
