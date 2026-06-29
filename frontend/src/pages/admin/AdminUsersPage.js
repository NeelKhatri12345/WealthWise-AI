import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function AdminUsersPage() {
    useDocumentTitle("Manage Users");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "User Management", description: "View and manage registered users" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "User management table placeholder" }) })] }));
}
