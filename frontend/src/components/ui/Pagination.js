import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/utils/cn";
import { Button } from "./Button";
export function Pagination({ currentPage, totalPages, onPageChange, className }) {
    const pages = getVisiblePages(currentPage, totalPages);
    return (_jsxs("nav", { className: cn("flex items-center gap-1", className), children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onPageChange(currentPage - 1), disabled: currentPage <= 1, children: "Previous" }), pages.map((page, i) => page === "..." ? (_jsx("span", { className: "px-2 text-wealth-muted", children: "\u2026" }, `ellipsis-${i}`)) : (_jsx(Button, { variant: page === currentPage ? "primary" : "ghost", size: "sm", onClick: () => onPageChange(page), children: page }, page))), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onPageChange(currentPage + 1), disabled: currentPage >= totalPages, children: "Next" })] }));
}
function getVisiblePages(current, total) {
    if (total <= 7)
        return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3)
        return [1, 2, 3, 4, "...", total];
    if (current >= total - 2)
        return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
}
