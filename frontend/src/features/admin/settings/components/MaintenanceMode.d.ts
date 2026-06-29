interface MaintenanceModeProps {
    isEnabled: boolean;
    scheduledAt?: string;
    onToggle: (enabled: boolean) => void;
    onSchedule?: (dateTime: string) => void;
}
export declare const MaintenanceMode: ({ isEnabled, scheduledAt, onToggle, onSchedule }: MaintenanceModeProps) => import("react").JSX.Element;
export {};
