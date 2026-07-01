import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";

interface InfoCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function InfoCard({
  title,
  children,
  footer,
  className,
}: InfoCardProps) {
  return (
    <Card padding="none" className={cn("overflow-hidden", className)}>
      <div className="border-b border-wealth-border px-6 py-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-wealth-border bg-gray-50 px-6 py-3">
          {footer}
        </div>
      )}
    </Card>
  );
}
