interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}
interface NotificationPreferencesProps {
  preferences: NotificationPreference[];
  onToggle: (key: string, channel: "email" | "push", enabled: boolean) => void;
  onSave?: () => void;
  isLoading?: boolean;
}
export declare const NotificationPreferences: ({
  preferences,
  onToggle,
  onSave,
  isLoading,
}: NotificationPreferencesProps) => import("react").JSX.Element;
export {};
