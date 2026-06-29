import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const RiskAssessment = ({ questions, onSubmit, isLoading = false }) => {
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentQuestion = questions[currentIndex];
    const isComplete = Object.keys(answers).length === questions.length;
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const handleAnswer = (questionId, value) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
        }
    };
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-2 text-lg font-semibold text-gray-900", children: "Risk Assessment" }), _jsxs("p", { className: "mb-4 text-sm text-gray-500", children: ["Question ", currentIndex + 1, " of ", questions.length] }), _jsx("div", { className: "mb-6 h-2 w-full rounded-full bg-gray-200", children: _jsx("div", { className: "h-2 rounded-full bg-indigo-600 transition-all", style: { width: `${progress}%` } }) }), currentQuestion && (_jsxs("div", { children: [_jsx("p", { className: "mb-4 text-base font-medium text-gray-900", children: currentQuestion.text }), _jsx("div", { className: "space-y-2", children: currentQuestion.options.map((opt) => (_jsx("button", { onClick: () => handleAnswer(currentQuestion.id, opt.value), className: `w-full rounded-lg border p-3 text-left text-sm transition-colors ${answers[currentQuestion.id] === opt.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`, children: opt.label }, opt.value))) })] })), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx("button", { onClick: () => setCurrentIndex((i) => Math.max(0, i - 1)), disabled: currentIndex === 0, className: "rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50", children: "Previous" }), isComplete && (_jsx("button", { onClick: () => onSubmit(answers), disabled: isLoading, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50", children: isLoading ? 'Submitting...' : 'Submit Assessment' }))] })] }));
};
