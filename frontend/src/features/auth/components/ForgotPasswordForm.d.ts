import { z } from 'zod';
declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
interface ForgotPasswordFormProps {
    onSubmit: (data: ForgotPasswordFormValues) => void;
    isLoading?: boolean;
}
export declare const ForgotPasswordForm: ({ onSubmit, isLoading }: ForgotPasswordFormProps) => import("react").JSX.Element;
export {};
