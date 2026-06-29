import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
};
function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
export function Avatar({ src, alt, name, size = "md", className }) {
    if (src) {
        return (_jsx("img", { src: src, alt: alt || name || "Avatar", className: cn("rounded-full object-cover", sizeClasses[size], className) }));
    }
    return (_jsx("div", { className: cn("flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700", sizeClasses[size], className), children: name ? getInitials(name) : "?" }));
}
