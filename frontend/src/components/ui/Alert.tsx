import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

const variants = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

interface AlertProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  title?: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ children, variant = "info", title, onClose, className }: AlertProps) {
  return (
    <div className={cn("rounded-lg border p-4", variants[variant], className)} role="alert">
      <div className="flex items-start justify-between">
        <div>
          {title && <p className="mb-1 font-medium">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
            &#x2715;
          </button>
        )}
      </div>
    </div>
  );
}
