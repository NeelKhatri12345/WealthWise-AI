interface SecuritySettingsProps {
  twoFactorEnabled: boolean;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  onToggle2FA: (enabled: boolean) => Promise<void>;
}
export declare const SecuritySettings: ({
  twoFactorEnabled,
  onChangePassword,
  onToggle2FA,
}: SecuritySettingsProps) => import("react").JSX.Element;
export {};
