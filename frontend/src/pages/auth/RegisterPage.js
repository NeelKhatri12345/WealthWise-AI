import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { registerSchema, } from "@/forms/schemas/register.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
export default function RegisterPage() {
    useDocumentTitle("Register");
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });
    const onSubmit = handleSubmit(async () => {
        setServerError(null);
        // TODO: Wire up registration API call
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Create Account" }), _jsx("p", { className: "mt-1 text-sm text-wealth-muted", children: "Start your financial wellness journey" })] }), serverError && (_jsx(Alert, { variant: "error", className: "mb-4", onClose: () => setServerError(null), children: serverError })), _jsxs("form", { onSubmit: onSubmit, noValidate: true, className: "space-y-4", children: [_jsx(Input, { ...register("fullName"), id: "fullName", type: "text", label: "Full Name", placeholder: "John Doe", error: errors.fullName?.message, autoComplete: "name" }), _jsx(Input, { ...register("email"), id: "email", type: "email", label: "Email address", placeholder: "you@example.com", error: errors.email?.message, autoComplete: "email" }), _jsx(Input, { ...register("password"), id: "password", type: "password", label: "Password", placeholder: "Create a password", error: errors.password?.message, autoComplete: "new-password", helperText: "At least 8 characters with uppercase, lowercase, and a number" }), _jsx(Input, { ...register("confirmPassword"), id: "confirmPassword", type: "password", label: "Confirm Password", placeholder: "Re-enter your password", error: errors.confirmPassword?.message, autoComplete: "new-password" }), _jsx(Button, { type: "submit", className: "w-full", isLoading: isSubmitting, children: "Create account" })] }), _jsxs("p", { className: "mt-6 text-center text-sm text-wealth-muted", children: ["Already have an account?", " ", _jsx(Link, { to: ROUTES.LOGIN, className: "font-medium text-primary-600 hover:text-primary-700", children: "Sign in" })] })] }));
}
