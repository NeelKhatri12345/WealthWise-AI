import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
const reportSchema = z.object({
    type: z.enum(['monthly', 'quarterly', 'annual', 'custom']),
    dateFrom: z.string().min(1, 'Start date is required'),
    dateTo: z.string().min(1, 'End date is required'),
    includeCharts: z.boolean().optional(),
    includeSummary: z.boolean().optional(),
});
export const ReportGenerator = ({ onGenerate, isLoading = false }) => {
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(reportSchema),
        defaultValues: { includeCharts: true, includeSummary: true },
    });
    return (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm border border-gray-100", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-gray-900", children: "Generate Report" }), _jsxs("form", { onSubmit: handleSubmit(onGenerate), className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Report Type" }), _jsxs("select", { ...register('type'), className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500", children: [_jsx("option", { value: "monthly", children: "Monthly Report" }), _jsx("option", { value: "quarterly", children: "Quarterly Report" }), _jsx("option", { value: "annual", children: "Annual Report" }), _jsx("option", { value: "custom", children: "Custom Range" })] }), errors.type && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.type.message })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "From" }), _jsx("input", { type: "date", ...register('dateFrom'), className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), errors.dateFrom && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.dateFrom.message })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "To" }), _jsx("input", { type: "date", ...register('dateTo'), className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" }), errors.dateTo && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.dateTo.message })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700", children: [_jsx("input", { type: "checkbox", ...register('includeCharts'), className: "rounded text-indigo-600" }), "Include Charts"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700", children: [_jsx("input", { type: "checkbox", ...register('includeSummary'), className: "rounded text-indigo-600" }), "Include Summary"] })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: isLoading ? 'Generating...' : 'Generate Report' })] })] }));
};
