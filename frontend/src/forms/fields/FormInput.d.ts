import { type FieldValues, type Path } from "react-hook-form";
interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
}
export declare function FormInput<T extends FieldValues>({
  name,
  label,
  type,
  placeholder,
  helperText,
  className,
}: FormInputProps<T>): import("react").JSX.Element;
export {};
