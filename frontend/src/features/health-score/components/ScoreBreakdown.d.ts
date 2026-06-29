interface ScoreFactor {
    name: string;
    score: number;
    maxScore: number;
    description: string;
}
interface ScoreBreakdownProps {
    factors: ScoreFactor[];
}
export declare const ScoreBreakdown: ({ factors }: ScoreBreakdownProps) => import("react").JSX.Element;
export {};
