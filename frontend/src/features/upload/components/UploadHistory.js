import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
export const UploadHistory = ({ uploads, onRetry }) => {
    const statusBadge = (status) => {
        const styles = {
            completed: 'bg-green-100 text-green-700',
            processing: 'bg-yellow-100 text-yellow-700',
            failed: 'bg-red-100 text-red-700',
        };
        return (_jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`, children: status.charAt(0).toUpperCase() + status.slice(1) }));
    };
    return (_jsxs("div", { className: "rounded-xl bg-white shadow-sm border border-gray-100", children: [_jsx("div", { className: "border-b border-gray-100 px-6 py-4", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Upload History" }) }), uploads.length === 0 ? (_jsx("div", { className: "p-6 text-center text-sm text-gray-500", children: "No previous uploads" })) : (_jsx("div", { className: "divide-y divide-gray-100", children: uploads.map((upload) => (_jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: upload.fileName }), _jsxs("p", { className: "text-xs text-gray-500", children: [upload.uploadDate, upload.transactionCount !== undefined && (_jsxs(_Fragment, { children: [" \u00B7 ", upload.transactionCount, " transactions"] }))] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [statusBadge(upload.status), upload.status === 'failed' && onRetry && (_jsx("button", { onClick: () => onRetry(upload.id), className: "text-xs text-indigo-600 hover:text-indigo-500", children: "Retry" }))] })] }, upload.id))) }))] }));
};
