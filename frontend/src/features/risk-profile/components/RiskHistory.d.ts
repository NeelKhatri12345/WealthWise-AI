interface RiskHistoryPoint {
    date: string;
    score: number;
    level: string;
}
interface RiskHistoryProps {
    data: RiskHistoryPoint[];
    title?: string;
}
export declare const RiskHistory: ({ data, title }: RiskHistoryProps) => import("react").JSX.Element;
export {};
