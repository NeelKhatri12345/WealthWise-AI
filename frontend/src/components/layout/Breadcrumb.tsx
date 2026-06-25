import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center text-sm text-wealth-muted", className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link to={item.href} className="hover:text-primary-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
