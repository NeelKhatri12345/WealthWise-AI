import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ProfileHeader = ({ name, email, avatarUrl, memberSince }) => {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return (_jsxs("div", { className: "flex items-center gap-6 rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [avatarUrl ? (_jsx("img", { src: avatarUrl, alt: name, className: "h-20 w-20 rounded-full object-cover" })) : (_jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600", children: initials })), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: name }), _jsx("p", { className: "text-sm text-gray-500", children: email }), memberSince && (_jsxs("p", { className: "mt-1 text-xs text-gray-400", children: ["Member since ", memberSince] }))] })] }));
};
