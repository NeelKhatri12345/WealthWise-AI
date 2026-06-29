import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function ReportsPage() {
    useDocumentTitle("Reports");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Reports", description: "Generate and download financial reports" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Reports list placeholder" }) })] }));
}
