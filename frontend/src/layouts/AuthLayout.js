import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
export function AuthLayout() {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsx(Outlet, {}) }) }));
}
