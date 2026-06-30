import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginSchema } from "@/forms/schemas/login.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
export default function LoginPage() {
    useDocumentTitle("Login");
    // Server-side error state — will be populated when auth is wired up
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    // Placeholder submit handler — no API call yet
    const onSubmit = handleSubmit(async () => {
        setServerError(null);
        // TODO: Wire up authentication API call
        // Example:
        // try {
        //   await dispatch(login(_data)).unwrap();
        //   navigate(ROUTES.DASHBOARD);
        // } catch (err) {
        //   setServerError(err.message);
        // }
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Welcome Back" }), _jsx("p", { className: "mt-1 text-sm text-wealth-muted", children: "Sign in to your WealthWise account" })] }), serverError && (_jsx(Alert, { variant: "error", className: "mb-4", onClose: () => setServerError(null), children: serverError })), _jsxs("form", { onSubmit: onSubmit, noValidate: true, className: "space-y-4", children: [_jsx(Input, { ...register("email"), id: "email", type: "email", label: "Email address", placeholder: "you@example.com", error: errors.email?.message, autoComplete: "email" }), _jsx(Input, { ...register("password"), id: "password", type: "password", label: "Password", placeholder: "Enter your password", error: errors.password?.message, autoComplete: "current-password" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border-wealth-border text-primary-600 focus:ring-primary-300" }), "Remember me"] }), _jsx(Link, { to: ROUTES.FORGOT_PASSWORD, className: "text-sm font-medium text-primary-600 hover:text-primary-700", children: "Forgot password?" })] }), _jsx(Button, { type: "submit", className: "w-full", isLoading: isSubmitting, children: "Sign in" })] }), _jsxs("p", { className: "mt-6 text-center text-sm text-wealth-muted", children: ["Don't have an account?", " ", _jsx(Link, { to: ROUTES.REGISTER, className: "font-medium text-primary-600 hover:text-primary-700", children: "Create one" })] })] }));
}
