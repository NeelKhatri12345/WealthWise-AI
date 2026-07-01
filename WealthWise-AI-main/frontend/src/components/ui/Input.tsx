import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** Field label rendered above the input */
  label?: string;
  /** Validation error message — also sets aria-invalid */
  error?: string;
  /** Hint text shown below the input when there is no error */
  helperText?: string;
  /** Icon element rendered inside the input on the left */
  leftIcon?: ReactNode;
  /** Icon element rendered inside the input on the right (hidden when password toggle is active) */
  rightIcon?: ReactNode;
}

// ---------------------------------------------------------------------------
// Password toggle icon (internal)
// ---------------------------------------------------------------------------

function EyeIcon({ visible }: { visible: boolean }) {
  // Renders an eye (visible) or eye-off (hidden) icon
  if (visible) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id: externalId,
      type = "text",
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const id = externalId || autoId;

    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText && !error ? `${id}-helper` : undefined;
    const describedBy =
      [errorId, helperId].filter(Boolean).join(" ") || undefined;

    // Password visibility toggle
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPassword && showPassword ? "text" : type;

    const hasLeftIcon = Boolean(leftIcon);
    const hasRightAddon = Boolean(rightIcon) || isPassword;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {hasLeftIcon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={resolvedType}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              // Base
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
              // Transition
              "transition-colors duration-150",
              // Focus
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              // Error vs normal border
              error
                ? "border-wealth-danger focus-visible:ring-red-300"
                : "border-wealth-border focus-visible:border-primary-500 focus-visible:ring-primary-300",
              // Disabled
              "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
              // Icon padding adjustments
              hasLeftIcon && "pl-10",
              hasRightAddon && "pr-10",
              className,
            )}
            {...props}
          />

          {/* Right side: password toggle OR rightIcon */}
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon visible={showPassword} />
            </button>
          ) : (
            hasRightAddon && (
              <span
                className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                aria-hidden="true"
              >
                {rightIcon}
              </span>
            )
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="mt-1 text-xs text-wealth-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text (only when no error) */}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-wealth-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
