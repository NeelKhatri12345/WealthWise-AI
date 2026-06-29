import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
export function Header() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    return (_jsxs("header", { className: "flex h-16 items-center justify-between border-b border-wealth-border bg-wealth-card px-6", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "WealthWise AI" }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: toggleTheme, className: "rounded-lg p-2 text-wealth-muted hover:bg-gray-100", "aria-label": "Toggle theme", children: theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19" }), _jsx(Avatar, { name: user ? `${user.firstName} ${user.lastName}` : undefined, size: "sm" })] })] }));
}
