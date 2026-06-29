import { jsx as _jsx } from "react/jsx-runtime";
import { useFormContext } from "react-hook-form";
import { Select } from "@/components/ui/Select";
export function FormSelect({ name, label, options, placeholder, className, }) {
    const { register, formState: { errors }, } = useFormContext();
    const error = errors[name];
    return (_jsx(Select, { ...register(name), id: name, label: label, options: options, placeholder: placeholder, error: error?.message, className: className }));
}
