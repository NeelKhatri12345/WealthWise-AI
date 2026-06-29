import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function RiskProfilePage() {
    useDocumentTitle("Risk Profile");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Risk Profile", description: "Understand your financial risk tolerance and exposure" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Risk profile assessment placeholder" }) })] }));
}
