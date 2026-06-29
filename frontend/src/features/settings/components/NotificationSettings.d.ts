interface NotificationSettingsProps {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    onToggle: (key: 'emailNotifications' | 'pushNotifications' | 'weeklyDigest', enabled: boolean) => void;
}
export declare const NotificationSettings: ({ emailNotifications, pushNotifications, weeklyDigest, onToggle, }: NotificationSettingsProps) => import("react").JSX.Element;
export {};
