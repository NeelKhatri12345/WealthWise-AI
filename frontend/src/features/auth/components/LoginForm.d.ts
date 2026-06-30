type LoginFormValues = {
  email: string;
  password: string;
};
interface LoginFormProps {
  onSubmit: (data: LoginFormValues) => void;
  isLoading?: boolean;
}
export declare const LoginForm: ({
  onSubmit,
  isLoading,
}: LoginFormProps) => import("react").JSX.Element;
export {};
