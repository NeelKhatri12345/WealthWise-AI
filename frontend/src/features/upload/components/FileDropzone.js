import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
export const FileDropzone = ({ onFilesSelected, acceptedFormats = ['.pdf', '.csv', '.xlsx'], maxSizeMB = 10, multiple = false, }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        onFilesSelected(files);
    }, [onFilesSelected]);
    const handleFileInput = useCallback((e) => {
        if (e.target.files) {
            onFilesSelected(Array.from(e.target.files));
        }
    }, [onFilesSelected]);
    return (_jsxs("div", { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, className: `relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`, children: [_jsx("svg", { className: "mb-4 h-12 w-12 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), _jsx("p", { className: "mb-2 text-sm font-medium text-gray-700", children: "Drag & drop your bank statement here" }), _jsxs("p", { className: "mb-4 text-xs text-gray-500", children: ["Supports ", acceptedFormats.join(', '), " (max ", maxSizeMB, "MB)"] }), _jsxs("label", { className: "cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors", children: ["Browse Files", _jsx("input", { type: "file", className: "hidden", accept: acceptedFormats.join(','), multiple: multiple, onChange: handleFileInput })] })] }));
};
