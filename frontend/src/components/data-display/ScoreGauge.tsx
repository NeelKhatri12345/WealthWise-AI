import { cn } from "@/utils/cn";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label?: string;
  grade?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-24 w-24 text-xl",
  md: "h-32 w-32 text-3xl",
  lg: "h-40 w-40 text-4xl",
};

function getScoreColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return "text-wealth-success";
  if (pct >= 0.6) return "text-primary-500";
  if (pct >= 0.4) return "text-wealth-warning";
  return "text-wealth-danger";
}

export function ScoreGauge({
  score,
  maxScore = 100,
  label,
  grade,
  size = "md",
  className,
}: ScoreGaugeProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-full border-4 border-current",
          sizeClasses[size],
          getScoreColor(score, maxScore),
        )}
      >
        <span className="font-bold">{score}</span>
        {grade && (
          <span className="text-xs font-medium opacity-75">{grade}</span>
        )}
      </div>
      {label && <p className="mt-2 text-sm text-wealth-muted">{label}</p>}
    </div>
  );
}
