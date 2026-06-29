import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function UploadPage() {
    useDocumentTitle("Upload Statements");
    return (_jsxs("div", { className: "animate-fade-in", children: [_jsx(PageHeader, { title: "Upload Statements", description: "Upload your bank or credit card statements for analysis" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-sm text-wealth-muted", children: "File upload area placeholder" }) })] }));
}
