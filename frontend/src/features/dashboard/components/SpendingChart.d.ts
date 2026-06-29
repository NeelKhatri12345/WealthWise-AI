interface SpendingDataPoint {
    month: string;
    amount: number;
}
interface SpendingChartProps {
    data: SpendingDataPoint[];
    title?: string;
}
export declare const SpendingChart: ({ data, title }: SpendingChartProps) => import("react").JSX.Element;
export {};
