import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "@/utils/cn";
const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
};
export function Tooltip({ content, children, position = "top", className }) {
    const [isVisible, setIsVisible] = useState(false);
    return (_jsxs("div", { className: "relative inline-block", onMouseEnter: () => setIsVisible(true), onMouseLeave: () => setIsVisible(false), children: [children, isVisible && (_jsx("div", { className: cn("absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg", positionClasses[position], className), children: content }))] }));
}
