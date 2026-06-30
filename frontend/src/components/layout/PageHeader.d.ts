import type { ReactNode } from "react";
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}
export declare function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps): import("react").JSX.Element;
export {};
