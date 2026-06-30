interface HealthScoreWidgetProps {
  score: number;
  maxScore?: number;
  trend?: "up" | "down" | "stable";
  onClick?: () => void;
}
export declare const HealthScoreWidget: ({
  score,
  maxScore,
  trend,
  onClick,
}: HealthScoreWidgetProps) => import("react").JSX.Element;
export {};
