import { z } from 'zod';
declare const profileSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    phone?: string | undefined;
    bio?: string | undefined;
}, {
    email: string;
    name: string;
    phone?: string | undefined;
    bio?: string | undefined;
}>;
type ProfileFormValues = z.infer<typeof profileSchema>;
interface ProfileFormProps {
    defaultValues: ProfileFormValues;
    onSubmit: (data: ProfileFormValues) => void;
    isLoading?: boolean;
}
export declare const ProfileForm: ({ defaultValues, onSubmit, isLoading }: ProfileFormProps) => import("react").JSX.Element;
export {};
