import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function DashboardPage() {
    useDocumentTitle("Dashboard");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Dashboard", description: "Overview of your financial health" }), _jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4", children: _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Dashboard content placeholder" }) }) })] }));
}
