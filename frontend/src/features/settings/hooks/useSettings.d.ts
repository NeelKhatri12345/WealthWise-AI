type Theme = 'light' | 'dark' | 'system';
interface AppSettings {
    language: string;
    currency: string;
    dateFormat: string;
    theme: Theme;
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
}
interface UseSettingsReturn {
    settings: AppSettings | null;
    isLoading: boolean;
    error: string | null;
    updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
    exportData: (format: 'json' | 'csv') => Promise<void>;
}
export declare const useSettings: () => UseSettingsReturn;
export {};
