interface MetricCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        direction: 'up' | 'down' | 'stable';
        value: string;
    };
    icon?: React.ReactNode;
}
export declare const MetricCard: ({ label, value, subtitle, trend, icon }: MetricCardProps) => import("react").JSX.Element;
export {};
