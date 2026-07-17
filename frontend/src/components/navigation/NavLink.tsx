import { NavLink as RouterNavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface NavLinkProps {
  to: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function NavLink({ to, icon, children, className }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary-50 text-primary-700"
            : "text-wealth-muted hover:bg-gray-50 hover:text-gray-900",
          className,
        )
      }
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </RouterNavLink>
  );
}
