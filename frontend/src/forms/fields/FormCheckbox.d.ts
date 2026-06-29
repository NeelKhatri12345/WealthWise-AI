import { type FieldValues, type Path } from "react-hook-form";
interface FormCheckboxProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    className?: string;
}
export declare function FormCheckbox<T extends FieldValues>({ name, label, className, }: FormCheckboxProps<T>): import("react").JSX.Element;
export {};
