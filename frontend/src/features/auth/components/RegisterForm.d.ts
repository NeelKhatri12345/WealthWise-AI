type RegisterFormValues = {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
};
interface RegisterFormProps {
    onSubmit: (data: RegisterFormValues) => void;
    isLoading?: boolean;
}
export declare const RegisterForm: ({ onSubmit, isLoading }: RegisterFormProps) => import("react").JSX.Element;
export {};
