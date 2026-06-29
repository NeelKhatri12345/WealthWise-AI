import { z } from 'zod';
declare const registerSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
}, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
}>, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
}, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
}>;
type RegisterFormValues = z.infer<typeof registerSchema>;
interface RegisterFormProps {
    onSubmit: (data: RegisterFormValues) => void;
    isLoading?: boolean;
}
export declare const RegisterForm: ({ onSubmit, isLoading }: RegisterFormProps) => import("react").JSX.Element;
export {};
