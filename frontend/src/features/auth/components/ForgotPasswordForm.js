import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});
export const ForgotPasswordForm = ({ onSubmit, isLoading = false }) => {
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
    });
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Enter your email address and we'll send you a link to reset your password." }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsx("input", { id: "email", type: "email", ...register('email'), className: "mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500", placeholder: "you@example.com" }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message }))] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: isLoading ? 'Sending...' : 'Send Reset Link' })] }));
};
