interface SocialLoginProps {
  onGoogleLogin?: () => void;
  onGithubLogin?: () => void;
  isLoading?: boolean;
}
export declare const SocialLogin: ({
  onGoogleLogin,
  onGithubLogin,
  isLoading,
}: SocialLoginProps) => import("react").JSX.Element;
export {};
