import { useState } from "react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "rounded-lg p-2 text-wealth-muted hover:bg-gray-100 lg:hidden",
          className,
        )}
        aria-label="Open menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-10 h-full w-64">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
