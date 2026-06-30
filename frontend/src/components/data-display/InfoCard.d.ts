import type { ReactNode } from "react";
interface InfoCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}
export declare function InfoCard({
  title,
  children,
  footer,
  className,
}: InfoCardProps): import("react").JSX.Element;
export {};
