import { type FieldValues, type Path } from "react-hook-form";
interface FormFileUploadProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  accept?: string;
  className?: string;
}
export declare function FormFileUpload<T extends FieldValues>({
  name,
  label,
  accept,
  className,
}: FormFileUploadProps<T>): import("react").JSX.Element;
export {};
