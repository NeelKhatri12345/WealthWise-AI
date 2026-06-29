import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function NotificationsPage() {
    useDocumentTitle("Notifications");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Notifications", description: "Stay updated with your financial alerts" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Notifications list placeholder" }) })] }));
}
