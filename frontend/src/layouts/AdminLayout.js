import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { AdminNav } from "@/components/navigation/AdminNav";
export function AdminLayout() {
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-wealth-bg", children: [_jsx(AdminNav, {}), _jsxs("div", { className: "flex flex-1 flex-col overflow-hidden", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: _jsx(Outlet, {}) })] })] }));
}
