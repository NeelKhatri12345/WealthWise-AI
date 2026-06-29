import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { storage } from "@/lib/storage";
const TOKEN_KEY = "wealthwise-token";
const USER_KEY = "wealthwise-user";
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => storage.get(USER_KEY));
    const [token, setToken] = useState(() => storage.get(TOKEN_KEY));
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const savedToken = storage.get(TOKEN_KEY);
        const savedUser = storage.get(USER_KEY);
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(savedUser);
        }
        setIsLoading(false);
    }, []);
    const login = useCallback((newToken, newUser) => {
        storage.set(TOKEN_KEY, newToken);
        storage.set(USER_KEY, newUser);
        setToken(newToken);
        setUser(newUser);
    }, []);
    const logout = useCallback(() => {
        storage.remove(TOKEN_KEY);
        storage.remove(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);
    const isAuthenticated = !!token && !!user;
    const value = useMemo(() => ({ user, token, isAuthenticated, isLoading, login, logout }), [user, token, isAuthenticated, isLoading, login, logout]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
