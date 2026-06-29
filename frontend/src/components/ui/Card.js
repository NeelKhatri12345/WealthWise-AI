import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};
export function Card({ children, className, padding = "md", ...props }) {
    return (_jsx("div", { className: cn("rounded-xl border border-wealth-border bg-wealth-card shadow-sm", paddingClasses[padding], className), ...props, children: children }));
}
