import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Variant style map
// ---------------------------------------------------------------------------

const variantStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  error: "bg-red-50 border-red-200 text-red-800",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: keyof typeof variantStyles;
  /** Optional bold heading rendered above the body */
  title?: string;
  /** Called when the dismiss button is clicked */
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    { children, variant = "info", title, onClose, className, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn("rounded-lg border p-4", variantStyles[variant], className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          {title && <p className="mb-1 font-medium">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Dismiss alert"
          >
            &#x2715;
          </button>
        )}
      </div>
    </div>
  ),
);

Alert.displayName = "Alert";
