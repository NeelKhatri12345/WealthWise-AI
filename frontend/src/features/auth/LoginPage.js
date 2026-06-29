import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { LoginForm, SocialLogin } from './components';
import { useLogin } from './hooks';
export const LoginPage = () => {
    const { login, isLoading, error } = useLogin();
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12", children: _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Welcome back" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Sign in to your WealthWise account" })] }), _jsxs("div", { className: "rounded-xl bg-white p-8 shadow-lg", children: [error && (_jsx("div", { className: "mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700", children: error })), _jsx(LoginForm, { onSubmit: login, isLoading: isLoading }), _jsx("div", { className: "mt-4 text-center", children: _jsx(Link, { to: "/forgot-password", className: "text-sm text-indigo-600 hover:text-indigo-500", children: "Forgot your password?" }) }), _jsx("div", { className: "mt-6", children: _jsx(SocialLogin, {}) })] }), _jsxs("p", { className: "text-center text-sm text-gray-600", children: ["Don't have an account?", ' ', _jsx(Link, { to: "/register", className: "font-medium text-indigo-600 hover:text-indigo-500", children: "Sign up" })] })] }) }));
};
