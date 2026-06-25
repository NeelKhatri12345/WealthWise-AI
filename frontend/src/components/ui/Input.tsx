import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2",
          error
            ? "border-wealth-danger focus:ring-red-300"
            : "border-wealth-border focus:border-primary-500 focus:ring-primary-300",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-wealth-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-wealth-muted">{helperText}</p>}
    </div>
  ),
);

Input.displayName = "Input";
