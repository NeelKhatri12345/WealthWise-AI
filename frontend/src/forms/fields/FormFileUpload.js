import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/utils/cn";
export function FormFileUpload({ name, label, accept, className, }) {
    const { setValue, formState: { errors }, } = useFormContext();
    const [fileName, setFileName] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const error = errors[name];
    const handleFile = useCallback((file) => {
        if (file) {
            setValue(name, file, { shouldValidate: true });
            setFileName(file.name);
        }
    }, [name, setValue]);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file ?? null);
    }, [handleFile]);
    return (_jsxs("div", { className: className, children: [label && _jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: label }), _jsxs("div", { onDragOver: (e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }, onDragLeave: () => setIsDragging(false), onDrop: handleDrop, className: cn("flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors", isDragging
                    ? "border-primary-500 bg-primary-50"
                    : "border-wealth-border hover:border-primary-300", error && "border-wealth-danger"), children: [_jsx("p", { className: "mb-1 text-sm text-wealth-muted", children: fileName || "Drag & drop a file here, or click to browse" }), _jsx("input", { type: "file", accept: accept, onChange: (e) => handleFile(e.target.files?.[0] ?? null), className: "absolute inset-0 cursor-pointer opacity-0", style: { position: "relative" } })] }), error && _jsx("p", { className: "mt-1 text-xs text-wealth-danger", children: error.message })] }));
}
