import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { cn } from "@/utils/cn";

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  className?: string;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  className,
}: FormCheckboxProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <input
        {...register(name)}
        id={name}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-wealth-border text-primary-500 focus:ring-primary-300"
      />
      <div>
        <label htmlFor={name} className="text-sm text-gray-700">
          {label}
        </label>
        {error && (
          <p className="text-xs text-wealth-danger">
            {error.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
