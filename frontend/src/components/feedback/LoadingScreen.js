import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Spinner } from "@/components/ui/Spinner";
export function LoadingScreen() {
    return (_jsx("div", { className: "flex h-screen items-center justify-center bg-wealth-bg", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx(Spinner, { size: "lg" }), _jsx("p", { className: "text-sm text-wealth-muted", children: "Loading..." })] }) }));
}
