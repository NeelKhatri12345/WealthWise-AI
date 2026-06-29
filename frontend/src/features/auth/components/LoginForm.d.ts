import { z } from 'zod';
declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
type LoginFormValues = z.infer<typeof loginSchema>;
interface LoginFormProps {
    onSubmit: (data: LoginFormValues) => void;
    isLoading?: boolean;
}
export declare const LoginForm: ({ onSubmit, isLoading }: LoginFormProps) => import("react").JSX.Element;
export {};
