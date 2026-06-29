import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const AccountDeletion = ({ onDelete }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const handleDelete = async () => {
        if (confirmText !== 'DELETE')
            return;
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    };
    return (_jsxs("div", { className: "rounded-xl border border-red-200 bg-red-50 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-red-900", children: "Danger Zone" }), _jsx("p", { className: "mt-1 text-sm text-red-700", children: "Permanently delete your account and all associated data. This action cannot be undone." }), !showConfirm ? (_jsx("button", { onClick: () => setShowConfirm(true), className: "mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors", children: "Delete Account" })) : (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("p", { className: "text-sm text-red-700", children: ["Type ", _jsx("strong", { children: "DELETE" }), " to confirm:"] }), _jsx("input", { type: "text", value: confirmText, onChange: (e) => setConfirmText(e.target.value), className: "w-full rounded-lg border border-red-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-red-500", placeholder: "Type DELETE" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: handleDelete, disabled: confirmText !== 'DELETE' || isDeleting, className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors", children: isDeleting ? 'Deleting...' : 'Permanently Delete' }), _jsx("button", { onClick: () => {
                                    setShowConfirm(false);
                                    setConfirmText('');
                                }, className: "rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors", children: "Cancel" })] })] }))] }));
};
