import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChatInterface, AdviceCard, CoachSidebar } from './components';
import { useCoachChat } from './hooks';
const suggestedTopics = [
    { id: 'savings', label: 'How can I save more?', icon: '\uD83D\uDCB0' },
    { id: 'invest', label: 'Where should I invest?', icon: '\uD83D\uDCC8' },
    { id: 'debt', label: 'How to pay off debt faster?', icon: '\uD83D\uDCB3' },
    { id: 'budget', label: 'Help me create a budget', icon: '\uD83D\uDCCB' },
    { id: 'retire', label: 'Am I on track for retirement?', icon: '\uD83C\uDFD6\uFE0F' },
];
export const AICoachPage = () => {
    const { messages, sendMessage, isTyping } = useCoachChat();
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "AI Financial Coach" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Get personalized financial advice powered by AI" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-4", children: [_jsx("div", { className: "lg:col-span-3", children: _jsx(ChatInterface, { messages: messages, onSendMessage: sendMessage, isTyping: isTyping }) }), _jsxs("div", { className: "space-y-4", children: [_jsx(CoachSidebar, { topics: suggestedTopics, onTopicSelect: sendMessage }), _jsx(AdviceCard, { title: "Track Your Spending", description: "Monitoring daily expenses is the first step to financial freedom.", category: "Tip of the Day" })] })] })] }));
};
