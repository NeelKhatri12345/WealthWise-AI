import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface NavGroupProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function NavGroup({ label, children, className }: NavGroupProps) {
  return (
    <div className={cn("mb-4", className)}>
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-wealth-muted">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
