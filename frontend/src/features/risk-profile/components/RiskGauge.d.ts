type RiskLevel = "low" | "moderate" | "high" | "very-high";
interface RiskGaugeProps {
  level: RiskLevel;
  score: number;
  maxScore?: number;
}
export declare const RiskGauge: ({
  level,
  score,
  maxScore,
}: RiskGaugeProps) => import("react").JSX.Element;
export {};
