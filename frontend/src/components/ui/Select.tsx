import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import type { SelectOption } from "@/types/common.types";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <select
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
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-wealth-danger">{error}</p>}
    </div>
  ),
);

Select.displayName = "Select";
