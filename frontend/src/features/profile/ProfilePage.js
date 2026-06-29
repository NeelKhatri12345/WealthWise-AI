import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ProfileHeader, ProfileForm, SecuritySettings, AccountDeletion } from './components';
import { useProfile } from './hooks';
export const ProfilePage = () => {
    const { profile, isLoading, error, updateProfile, changePassword, toggle2FA, deleteAccount } = useProfile();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" }) }));
    }
    if (error || !profile) {
        return (_jsx("div", { className: "rounded-lg bg-red-50 p-4 text-red-700", children: _jsx("p", { children: error ?? 'Failed to load profile' }) }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Profile" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage your account settings" })] }), _jsx(ProfileHeader, { name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl, memberSince: profile.memberSince }), _jsx(ProfileForm, { defaultValues: { name: profile.name, email: profile.email, phone: profile.phone, bio: profile.bio }, onSubmit: updateProfile }), _jsx(SecuritySettings, { twoFactorEnabled: profile.twoFactorEnabled, onChangePassword: changePassword, onToggle2FA: toggle2FA }), _jsx(AccountDeletion, { onDelete: deleteAccount })] }));
};
