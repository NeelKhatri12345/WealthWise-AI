type ForgotPasswordFormValues = {
  email: string;
};
interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormValues) => void;
  isLoading?: boolean;
}
export declare const ForgotPasswordForm: ({
  onSubmit,
  isLoading,
}: ForgotPasswordFormProps) => import("react").JSX.Element;
export {};
