interface GrowthPoint {
    date: string;
    newUsers: number;
    totalUsers: number;
}
interface UserGrowthChartProps {
    data: GrowthPoint[];
}
export declare const UserGrowthChart: ({ data }: UserGrowthChartProps) => import("react").JSX.Element;
export {};
