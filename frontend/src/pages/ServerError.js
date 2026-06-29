import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function ServerError() {
    useDocumentTitle("Server Error");
    const handleReload = () => window.location.reload();
    return (_jsxs("div", { className: "flex min-h-screen flex-col items-center justify-center bg-wealth-bg p-4 text-center", children: [_jsx("h1", { className: "text-8xl font-bold text-wealth-danger", children: "500" }), _jsx("h2", { className: "mt-4 text-2xl font-semibold text-gray-900", children: "Internal Server Error" }), _jsx("p", { className: "mt-2 max-w-md text-wealth-muted", children: "Something went wrong on our end. Please try again later." }), _jsx(Button, { onClick: handleReload, className: "mt-6", children: "Reload Page" })] }));
}
