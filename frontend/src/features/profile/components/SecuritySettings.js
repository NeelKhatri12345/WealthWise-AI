import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const SecuritySettings = ({ twoFactorEnabled, onChangePassword, onToggle2FA, }) => {
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setError(null);
        await onChangePassword(currentPassword, newPassword);
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Security" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Password" }), _jsx("p", { className: "text-xs text-gray-500", children: "Change your account password" })] }), _jsx("button", { onClick: () => setIsChangingPassword(!isChangingPassword), className: "text-sm font-medium text-indigo-600 hover:text-indigo-500", children: isChangingPassword ? 'Cancel' : 'Change' })] }), isChangingPassword && (_jsxs("div", { className: "mt-4 space-y-3", children: [error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsx("input", { type: "password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), placeholder: "Current password", className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), _jsx("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "New password", className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), _jsx("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Confirm new password", className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), _jsx("button", { onClick: handlePasswordChange, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors", children: "Update Password" })] }))] }), _jsxs("div", { className: "flex items-center justify-between border-t border-gray-100 pt-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Two-Factor Authentication" }), _jsx("p", { className: "text-xs text-gray-500", children: twoFactorEnabled ? 'Enabled - extra security active' : 'Add an extra layer of security' })] }), _jsx("button", { onClick: () => onToggle2FA(!twoFactorEnabled), className: `h-6 w-10 rounded-full transition-colors ${twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`, children: _jsx("span", { className: `block h-4 w-4 rounded-full bg-white shadow transition-transform ${twoFactorEnabled ? 'translate-x-5' : 'translate-x-1'}` }) })] })] })] }));
};
