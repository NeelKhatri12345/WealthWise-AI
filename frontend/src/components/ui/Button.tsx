import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-300",
  secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-300",
  outline: "border border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-300",
  ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
  danger: "bg-wealth-danger text-white hover:bg-red-600 focus:ring-red-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
