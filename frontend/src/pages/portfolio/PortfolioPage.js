import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function PortfolioPage() {
    useDocumentTitle("Portfolio");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Portfolio Recommendations", description: "AI-powered investment suggestions based on your profile" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Portfolio recommendations placeholder" }) })] }));
}
