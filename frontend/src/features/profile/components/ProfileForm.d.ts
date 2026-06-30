type ProfileFormValues = {
    email: string;
    name: string;
    phone?: string;
    bio?: string;
};
interface ProfileFormProps {
    defaultValues: ProfileFormValues;
    onSubmit: (data: ProfileFormValues) => void;
    isLoading?: boolean;
}
export declare const ProfileForm: ({ defaultValues, onSubmit, isLoading }: ProfileFormProps) => import("react").JSX.Element;
export {};
