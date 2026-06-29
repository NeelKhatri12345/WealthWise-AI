interface ScoreGaugeProps {
    score: number;
    maxScore?: number;
    label?: string;
    grade?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}
export declare function ScoreGauge({ score, maxScore, label, grade, size, className }: ScoreGaugeProps): import("react").JSX.Element;
export {};
