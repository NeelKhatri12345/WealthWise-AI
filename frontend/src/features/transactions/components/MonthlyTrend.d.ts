interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
}
interface MonthlyTrendProps {
    data: MonthlyData[];
    title?: string;
}
export declare const MonthlyTrend: ({ data, title }: MonthlyTrendProps) => import("react").JSX.Element;
export {};
