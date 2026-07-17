import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import type { SelectOption } from "@/types/common.types";

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  className,
}: FormSelectProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];

  return (
    <Select
      {...register(name)}
      id={name}
      label={label}
      options={options}
      placeholder={placeholder}
      error={error?.message as string | undefined}
      className={className}
    />
  );
}
