import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FileDropzone, UploadProgress, UploadHistory, StatementPreview } from './components';
import { useFileUpload } from './hooks';
export const UploadPage = () => {
    const { upload, progress, status, error, reset } = useFileUpload();
    const [currentFile, setCurrentFile] = useState(null);
    const handleFilesSelected = (files) => {
        if (files.length > 0) {
            setCurrentFile(files[0]);
            upload(files[0]);
        }
    };
    return (_jsxs("div", { className: "mx-auto max-w-4xl space-y-6 p-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Upload Statement" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Upload your bank statement for AI-powered analysis" })] }), _jsx(FileDropzone, { onFilesSelected: handleFilesSelected }), currentFile && status !== 'idle' && (_jsx(UploadProgress, { fileName: currentFile.name, progress: progress, status: status === 'idle' ? 'uploading' : status, errorMessage: error ?? undefined, onCancel: reset })), status === 'completed' && (_jsx(StatementPreview, { bankName: "Sample Bank", transactions: [], onConfirm: () => reset(), onReject: () => reset() })), _jsx(UploadHistory, { uploads: [] })] }));
};
