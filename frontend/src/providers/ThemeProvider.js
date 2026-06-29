import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { storage } from "@/lib/storage";
const THEME_KEY = "wealthwise-theme";
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const saved = storage.get(THEME_KEY);
        if (saved)
            return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        storage.set(THEME_KEY, theme);
    }, [theme]);
    const setTheme = useCallback((t) => setThemeState(t), []);
    const toggleTheme = useCallback(() => setThemeState((prev) => (prev === "dark" ? "light" : "dark")), []);
    return (_jsx(ThemeContext.Provider, { value: { theme, setTheme, toggleTheme }, children: children }));
}
