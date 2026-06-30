interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}
export declare function ProgressBar({
  value,
  max,
  label,
  showValue,
  color,
  size,
  className,
}: ProgressBarProps): import("react").JSX.Element;
export {};
