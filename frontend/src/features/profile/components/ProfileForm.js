import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    bio: z.string().max(200, 'Bio must be 200 characters or less').optional(),
});
export const ProfileForm = ({ defaultValues, onSubmit, isLoading = false }) => {
    const { register, handleSubmit, formState: { errors, isDirty }, } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues,
    });
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Edit Profile" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name" }), _jsx("input", { ...register('name'), className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), errors.name && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.name.message })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", ...register('email'), className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), errors.email && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Phone" }), _jsx("input", { type: "tel", ...register('phone'), className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500", placeholder: "Optional" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bio" }), _jsx("textarea", { ...register('bio'), rows: 3, className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500", placeholder: "Tell us about yourself..." }), errors.bio && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.bio.message })] })] }), _jsx("button", { type: "submit", disabled: isLoading || !isDirty, className: "mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: isLoading ? 'Saving...' : 'Save Changes' })] }));
};
