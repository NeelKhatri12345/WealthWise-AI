interface StatItem {
    label: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
}
interface QuickStatsProps {
    stats: StatItem[];
}
export declare const QuickStats: ({ stats }: QuickStatsProps) => import("react").JSX.Element;
export {};
