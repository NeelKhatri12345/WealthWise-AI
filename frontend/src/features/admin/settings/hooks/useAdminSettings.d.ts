interface AdminSettingsData {
    maintenanceMode: boolean;
    scheduledMaintenance?: string;
    configs: Array<{
        key: string;
        label: string;
        value: string;
        type: 'text' | 'number' | 'select';
        options?: string[];
        description?: string;
    }>;
    backup: {
        lastBackup?: string;
        nextScheduled?: string;
        frequency: string;
        status: 'success' | 'in-progress' | 'failed' | 'none';
    };
}
interface UseAdminSettingsReturn {
    data: AdminSettingsData | null;
    isLoading: boolean;
    error: string | null;
    toggleMaintenance: (enabled: boolean) => Promise<void>;
    updateConfig: (key: string, value: string) => void;
    saveConfigs: () => Promise<void>;
    triggerBackup: () => Promise<void>;
    updateBackupFrequency: (frequency: string) => Promise<void>;
}
export declare const useAdminSettings: () => UseAdminSettingsReturn;
export {};
