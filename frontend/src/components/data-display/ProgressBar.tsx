import { cn } from "@/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorClasses = {
  primary: "bg-primary-500",
  success: "bg-wealth-success",
  warning: "bg-wealth-warning",
  danger: "bg-wealth-danger",
};

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue,
  color = "primary",
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="text-wealth-muted">{label}</span>}
          {showValue && (
            <span className="font-medium text-gray-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200",
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            colorClasses[color],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
