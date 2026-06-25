import { cn } from "@/utils/cn";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t border-wealth-border bg-wealth-card px-6 py-4", className)}>
      <div className="flex items-center justify-between text-xs text-wealth-muted">
        <span>&copy; {new Date().getFullYear()} WealthWise AI. All rights reserved.</span>
        <span>v0.1.0</span>
      </div>
    </footer>
  );
}
