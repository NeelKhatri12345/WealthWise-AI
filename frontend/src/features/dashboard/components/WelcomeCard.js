import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export const WelcomeCard = ({ userName, lastLogin, netWorth }) => {
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 18)
            return 'Good afternoon';
        return 'Good evening';
    };
    return (_jsxs("div", { className: "rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg", children: [_jsxs("h2", { className: "text-2xl font-bold", children: [greeting(), ", ", userName, "!"] }), _jsx("p", { className: "mt-1 text-indigo-100", children: "Here's your financial overview for today." }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [netWorth !== undefined && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-indigo-200", children: "Net Worth" }), _jsxs("p", { className: "text-3xl font-bold", children: ["$", netWorth.toLocaleString()] })] })), lastLogin && (_jsxs("p", { className: "text-xs text-indigo-200", children: ["Last login: ", lastLogin] }))] })] }));
};
