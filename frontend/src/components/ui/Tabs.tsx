import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="flex border-b border-wealth-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-wealth-muted hover:text-gray-700",
              tab.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{activeContent}</div>
    </div>
  );
}
