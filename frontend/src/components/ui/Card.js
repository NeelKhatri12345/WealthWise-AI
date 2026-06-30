import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";
// ---------------------------------------------------------------------------
// Card (root)
// ---------------------------------------------------------------------------
const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};
export const Card = forwardRef(({ className, padding = "md", children, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("rounded-xl border border-wealth-border bg-wealth-card shadow-sm", paddingStyles[padding], className), ...props, children: children })));
Card.displayName = "Card";
// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------
export const CardHeader = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex flex-col gap-1.5 px-6 py-4", className), ...props })));
CardHeader.displayName = "CardHeader";
// ---------------------------------------------------------------------------
// CardTitle
// ---------------------------------------------------------------------------
export const CardTitle = forwardRef(({ className, children, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn("text-lg font-semibold text-gray-900", className), ...props, children: children })));
CardTitle.displayName = "CardTitle";
// ---------------------------------------------------------------------------
// CardDescription
// ---------------------------------------------------------------------------
export const CardDescription = forwardRef(({ className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn("text-sm text-wealth-muted", className), ...props })));
CardDescription.displayName = "CardDescription";
// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------
export const CardContent = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("px-6 py-4", className), ...props })));
CardContent.displayName = "CardContent";
// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------
export const CardFooter = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex items-center border-t border-wealth-border bg-gray-50 px-6 py-3", className), ...props })));
CardFooter.displayName = "CardFooter";
