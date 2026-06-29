import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export default function LoginPage() {
    useDocumentTitle("Login");
    return (_jsxs("div", { className: "animate-fade-in-up", children: [_jsx("h1", { className: "mb-2 text-center text-2xl font-bold text-gray-900", children: "Welcome Back" }), _jsx("p", { className: "mb-6 text-center text-sm text-wealth-muted", children: "Sign in to your WealthWise account" }), _jsx("div", { className: "card", children: _jsx("p", { className: "text-center text-sm text-wealth-muted", children: "Login form placeholder" }) })] }));
}
