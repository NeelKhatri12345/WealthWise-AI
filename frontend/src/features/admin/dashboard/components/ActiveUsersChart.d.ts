interface ActiveUsersPoint {
    time: string;
    count: number;
}
interface ActiveUsersChartProps {
    data: ActiveUsersPoint[];
}
export declare const ActiveUsersChart: ({ data }: ActiveUsersChartProps) => import("react").JSX.Element;
export {};
