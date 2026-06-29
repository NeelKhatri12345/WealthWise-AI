import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function SettingsPage() {
    useDocumentTitle("Settings");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Settings", description: "Configure your account preferences" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "Settings panel placeholder" }) })] }));
}
