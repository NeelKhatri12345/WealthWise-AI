import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-4 text-4xl text-wealth-muted">{icon}</div>}
      <h3 className="mb-1 text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-wealth-muted">{description}</p>}
      {action}
    </div>
  );
}
