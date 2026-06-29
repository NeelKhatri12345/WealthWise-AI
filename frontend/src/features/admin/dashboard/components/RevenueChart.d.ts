interface RevenuePoint {
    month: string;
    revenue: number;
    target: number;
}
interface RevenueChartProps {
    data: RevenuePoint[];
}
export declare const RevenueChart: ({ data }: RevenueChartProps) => import("react").JSX.Element;
export {};
