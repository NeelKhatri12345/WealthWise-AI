import type { ReactNode } from "react";
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  className?: string;
}
export declare function StatCard({
  title,
  value,
  change,
  icon,
  className,
}: StatCardProps): import("react").JSX.Element;
export {};
