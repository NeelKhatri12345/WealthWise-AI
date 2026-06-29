interface ScoreHistoryPoint {
    date: string;
    score: number;
}
interface ScoreHistoryProps {
    data: ScoreHistoryPoint[];
    title?: string;
}
export declare const ScoreHistory: ({ data, title }: ScoreHistoryProps) => import("react").JSX.Element;
export {};
