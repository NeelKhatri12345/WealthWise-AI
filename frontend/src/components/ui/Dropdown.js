import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";
export function Dropdown({ trigger, items, onSelect, className, align = "left" }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useClickOutside(() => setIsOpen(false));
    const handleSelect = useCallback((value) => {
        onSelect(value);
        setIsOpen(false);
    }, [onSelect]);
    return (_jsxs("div", { ref: ref, className: "relative inline-block", children: [_jsx("div", { onClick: () => setIsOpen((prev) => !prev), children: trigger }), isOpen && (_jsx("div", { className: cn("absolute z-40 mt-1 min-w-[160px] rounded-lg border border-wealth-border bg-white py-1 shadow-lg", align === "right" ? "right-0" : "left-0", className), children: items.map((item) => (_jsxs("button", { onClick: () => !item.disabled && handleSelect(item.value), disabled: item.disabled, className: "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50", children: [item.icon, item.label] }, item.value))) }))] }));
}
