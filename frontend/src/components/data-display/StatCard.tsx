import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, icon, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-start justify-between", className)}>
      <div>
        <p className="text-sm text-wealth-muted">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              change >= 0 ? "text-wealth-success" : "text-wealth-danger",
            )}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </p>
        )}
      </div>
      {icon && <div className="text-2xl text-primary-500">{icon}</div>}
    </Card>
  );
}
