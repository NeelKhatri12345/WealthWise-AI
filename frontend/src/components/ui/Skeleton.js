import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
export function Skeleton({ className, variant = "text", width, height }) {
    return (_jsx("div", { className: cn("animate-pulse bg-gray-200", variant === "text" && "h-4 rounded", variant === "circular" && "rounded-full", variant === "rectangular" && "rounded-lg", className), style: { width, height } }));
}
