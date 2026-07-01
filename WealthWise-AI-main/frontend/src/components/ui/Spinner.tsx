import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Size style map
// ---------------------------------------------------------------------------

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Spinner diameter */
  size?: keyof typeof sizeStyles;
  /** Accessible label announced to screen readers (defaults to "Loading…") */
  label?: string;
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", label = "Loading\u2026", className, ...props }, ref) => (
    <div ref={ref} role="status" {...props}>
      <svg
        className={cn(
          "animate-spin text-primary-500",
          sizeStyles[size],
          className,
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  ),
);

Spinner.displayName = "Spinner";
