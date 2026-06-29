import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from './components';
export const ForgotPasswordPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const handleSubmit = async (_data) => {
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setIsSubmitted(true);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12", children: _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Reset password" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "We'll send you instructions to reset your password" })] }), _jsx("div", { className: "rounded-xl bg-white p-8 shadow-lg", children: isSubmitted ? (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100", children: _jsx("svg", { className: "h-6 w-6 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }), _jsx("p", { className: "text-sm text-gray-600", children: "Check your email for a password reset link." })] })) : (_jsx(ForgotPasswordForm, { onSubmit: handleSubmit, isLoading: isLoading })) }), _jsx("p", { className: "text-center text-sm text-gray-600", children: _jsx(Link, { to: "/login", className: "font-medium text-indigo-600 hover:text-indigo-500", children: "Back to login" }) })] }) }));
};
