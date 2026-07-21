import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Variant & size style maps
// ---------------------------------------------------------------------------

const variantStyles = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-300 active:bg-primary-700",
  secondary:
    "bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-300 active:bg-secondary-700",
  outline:
    "border border-primary-500 text-primary-500 hover:bg-primary-50 focus-visible:ring-primary-300 active:bg-primary-100",
  danger:
    "bg-wealth-danger text-white hover:bg-red-600 focus-visible:ring-red-300 active:bg-red-700",
  ghost:
    "text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300 active:bg-gray-200",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
} as const;

const spinnerSizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: keyof typeof variantStyles;
  /** Button size */
  size?: keyof typeof sizeStyles;
  /** Shows a spinner and disables the button */
  isLoading?: boolean;
  /** Icon element rendered before children */
  leftIcon?: ReactNode;
  /** Icon element rendered after children */
  rightIcon?: ReactNode;
}

// ---------------------------------------------------------------------------
// Spinner (internal)
// ---------------------------------------------------------------------------

function LoadingSpinner({ size }: { size: keyof typeof spinnerSizes }) {
  return (
    <svg
      className={cn("animate-spin", spinnerSizes[size])}
      viewBox="0 0 24 24"
      fill="none"
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
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base
          "inline-flex items-center justify-center rounded-xl font-medium",
          // Transitions
          "transition-all duration-200 active:scale-[0.98]",
          // Focus ring (keyboard-only via focus-visible)
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          // Variant & size
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <LoadingSpinner size={size} />}
        {!isLoading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
