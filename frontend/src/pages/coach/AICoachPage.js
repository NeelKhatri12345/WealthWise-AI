import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function AICoachPage() {
    useDocumentTitle("AI Financial Coach");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "AI Financial Coach", description: "Get personalized financial advice from your AI assistant" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "AI chat interface placeholder" }) })] }));
}
