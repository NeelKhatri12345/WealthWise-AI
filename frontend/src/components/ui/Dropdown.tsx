import { useState, useCallback, type ReactNode } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  className?: string;
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, onSelect, className, align = "left" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setIsOpen(false);
    },
    [onSelect],
  );

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-40 mt-1 min-w-[160px] rounded-lg border border-wealth-border bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => !item.disabled && handleSelect(item.value)}
              disabled={item.disabled}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
