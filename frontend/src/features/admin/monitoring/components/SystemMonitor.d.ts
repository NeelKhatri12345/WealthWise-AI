interface SystemMetric {
    label: string;
    value: number;
    maxValue: number;
    unit: string;
    status: 'normal' | 'warning' | 'critical';
}
interface SystemMonitorProps {
    metrics: SystemMetric[];
}
export declare const SystemMonitor: ({ metrics }: SystemMonitorProps) => import("react").JSX.Element;
export {};
