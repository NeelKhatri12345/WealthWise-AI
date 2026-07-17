import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";

export interface QuickActionCardProps {
  label: string;
  description: string;
  icon: ReactNode;
  to: string;
  iconBg?: string;
  className?: string;
}

export function QuickActionCard({
  label,
  description,
  icon,
  to,
  iconBg = "bg-primary-50 text-primary-600",
  className,
}: QuickActionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      padding="md"
      className={cn(
        "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      onClick={() => navigate(to)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="mt-0.5 text-sm text-wealth-muted">{description}</p>
        </div>
      </div>
    </Card>
  );
}
