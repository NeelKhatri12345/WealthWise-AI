import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { forgotPasswordSchema, } from "@/forms/schemas/forgotPassword.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
export default function ForgotPasswordPage() {
    useDocumentTitle("Forgot Password");
    const [serverError, setServerError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });
    const onSubmit = handleSubmit(async () => {
        setServerError(null);
        setSuccessMessage(null);
        // TODO: Wire up password reset API call
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Forgot Password" }), _jsx("p", { className: "mt-1 text-sm text-wealth-muted", children: "Enter your email and we'll send you reset instructions" })] }), serverError && (_jsx(Alert, { variant: "error", className: "mb-4", onClose: () => setServerError(null), children: serverError })), successMessage && (_jsx(Alert, { variant: "success", className: "mb-4", onClose: () => setSuccessMessage(null), children: successMessage })), _jsxs("form", { onSubmit: onSubmit, noValidate: true, className: "space-y-4", children: [_jsx(Input, { ...register("email"), id: "email", type: "email", label: "Email address", placeholder: "you@example.com", error: errors.email?.message, autoComplete: "email" }), _jsx(Button, { type: "submit", className: "w-full", isLoading: isSubmitting, children: "Send reset link" })] }), _jsxs("p", { className: "mt-6 text-center text-sm text-wealth-muted", children: ["Remember your password?", " ", _jsx(Link, { to: ROUTES.LOGIN, className: "font-medium text-primary-600 hover:text-primary-700", children: "Sign in" })] })] }));
}
