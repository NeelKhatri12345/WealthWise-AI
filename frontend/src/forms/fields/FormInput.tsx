import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/Input";

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  helperText,
  className,
}: FormInputProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];

  return (
    <Input
      {...register(name)}
      id={name}
      label={label}
      type={type}
      placeholder={placeholder}
      error={error?.message as string | undefined}
      helperText={helperText}
      className={className}
    />
  );
}
