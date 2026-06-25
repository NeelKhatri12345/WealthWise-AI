import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className, padding = "md", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-wealth-border bg-wealth-card shadow-sm",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
