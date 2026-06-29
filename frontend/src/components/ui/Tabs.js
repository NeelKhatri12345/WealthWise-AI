import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/utils/cn";
export function Tabs({ tabs, defaultTab, onChange, className }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    };
    const activeContent = tabs.find((t) => t.id === activeTab)?.content;
    return (_jsxs("div", { className: className, children: [_jsx("div", { className: "flex border-b border-wealth-border", children: tabs.map((tab) => (_jsx("button", { onClick: () => !tab.disabled && handleTabChange(tab.id), disabled: tab.disabled, className: cn("px-4 py-2 text-sm font-medium transition-colors", activeTab === tab.id
                        ? "border-b-2 border-primary-500 text-primary-600"
                        : "text-wealth-muted hover:text-gray-700", tab.disabled && "cursor-not-allowed opacity-50"), children: tab.label }, tab.id))) }), _jsx("div", { className: "pt-4", children: activeContent })] }));
}
