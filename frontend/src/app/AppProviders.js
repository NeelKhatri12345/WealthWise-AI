import { jsx as _jsx } from "react/jsx-runtime";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
export function AppProviders({ children }) {
    return (_jsx(ReduxProvider, { store: store, children: _jsx(AuthProvider, { children: _jsx(ThemeProvider, { children: _jsx(ToastProvider, { children: children }) }) }) }));
}
