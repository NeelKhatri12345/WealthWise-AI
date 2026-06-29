import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function AdminDashboardPage() {
    useDocumentTitle("Admin Dashboard");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Admin Dashboard", description: "System overview and management" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Admin stats placeholder" }) })] }));
}
