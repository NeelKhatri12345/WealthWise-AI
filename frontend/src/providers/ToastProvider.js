import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Toaster } from "react-hot-toast";
export function ToastProvider({ children }) {
    return (_jsxs(_Fragment, { children: [children, _jsx(Toaster, { position: "top-right", gutter: 8, toastOptions: {
                    duration: 4000,
                    style: {
                        background: "#ffffff",
                        color: "#1e293b",
                        borderRadius: "0.75rem",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    },
                    success: {
                        iconTheme: { primary: "#10b981", secondary: "#ffffff" },
                    },
                    error: {
                        iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
                    },
                } })] }));
}
