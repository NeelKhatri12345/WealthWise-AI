import { jsx as _jsx } from "react/jsx-runtime";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
export function FormInput({ name, label, type = "text", placeholder, helperText, className, }) {
    const { register, formState: { errors }, } = useFormContext();
    const error = errors[name];
    return (_jsx(Input, { ...register(name), id: name, label: label, type: type, placeholder: placeholder, error: error?.message, helperText: helperText, className: className }));
}
