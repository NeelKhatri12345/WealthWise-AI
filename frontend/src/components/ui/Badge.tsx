import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Variant & size style maps
// ---------------------------------------------------------------------------

const variantStyles = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-gray-50 text-gray-500",
} as const;

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-0.5 text-xs gap-1.5",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: keyof typeof variantStyles;
  /** Badge size */
  size?: keyof typeof sizeStyles;
  /** Icon element rendered before children */
  leftIcon?: ReactNode;
  /** Icon element rendered after children */
  rightIcon?: ReactNode;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {leftIcon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </span>
  ),
);

Badge.displayName = "Badge";
