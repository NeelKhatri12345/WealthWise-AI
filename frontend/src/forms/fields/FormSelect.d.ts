import { type FieldValues, type Path } from "react-hook-form";
import type { SelectOption } from "@/types/common.types";
interface FormSelectProps<T extends FieldValues> {
    name: Path<T>;
    label?: string;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
}
export declare function FormSelect<T extends FieldValues>({ name, label, options, placeholder, className, }: FormSelectProps<T>): import("react").JSX.Element;
export {};
