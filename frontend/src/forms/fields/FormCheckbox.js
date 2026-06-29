import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFormContext } from "react-hook-form";
import { cn } from "@/utils/cn";
export function FormCheckbox({ name, label, className, }) {
    const { register, formState: { errors }, } = useFormContext();
    const error = errors[name];
    return (_jsxs("div", { className: cn("flex items-start gap-2", className), children: [_jsx("input", { ...register(name), id: name, type: "checkbox", className: "mt-1 h-4 w-4 rounded border-wealth-border text-primary-500 focus:ring-primary-300" }), _jsxs("div", { children: [_jsx("label", { htmlFor: name, className: "text-sm text-gray-700", children: label }), error && _jsx("p", { className: "text-xs text-wealth-danger", children: error.message })] })] }));
}
