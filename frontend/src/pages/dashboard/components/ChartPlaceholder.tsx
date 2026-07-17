import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface ChartPlaceholderProps {
  title?: string;
  className?: string;
}

export function ChartPlaceholder({
  title = "Spending Overview",
  className,
}: ChartPlaceholderProps) {
  /* Mock bar heights for a 7-month visual */
  const bars = [40, 65, 50, 80, 55, 70, 60];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  return (
    <Card padding="none" className={cn("overflow-hidden", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600">
          Last 7 months
        </span>
      </CardHeader>
      <CardContent>
        {/* Decorative bar chart placeholder */}
        <div className="flex h-48 items-end justify-between gap-3 sm:gap-4">
          {bars.map((height, i) => (
            <div key={months[i]} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-500"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-wealth-muted">{months[i]}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-wealth-border pt-4">
          <div>
            <p className="text-xs text-wealth-muted">Average Monthly</p>
            <p className="text-lg font-bold text-gray-900">$3,240</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-wealth-muted">vs Last Period</p>
            <p className="text-sm font-semibold text-wealth-success">-8.3%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
