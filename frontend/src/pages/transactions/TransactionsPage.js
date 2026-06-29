import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function TransactionsPage() {
    useDocumentTitle("Transactions");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Transactions", description: "View and manage your categorized transactions" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Transaction table placeholder" }) })] }));
}
