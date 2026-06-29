import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ChatMessage = ({ role, content, timestamp }) => {
    const isUser = role === 'user';
    return (_jsx("div", { className: `flex ${isUser ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-900'}`, children: [!isUser && (_jsx("p", { className: "mb-1 text-xs font-medium text-indigo-600", children: "AI Coach" })), _jsx("p", { className: "text-sm whitespace-pre-wrap", children: content }), _jsx("p", { className: `mt-1 text-xs ${isUser ? 'text-indigo-200' : 'text-gray-400'}`, children: timestamp })] }) }));
};
