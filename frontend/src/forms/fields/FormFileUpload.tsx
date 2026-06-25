import { useCallback, useState } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { cn } from "@/utils/cn";

interface FormFileUploadProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  accept?: string;
  className?: string;
}

export function FormFileUpload<T extends FieldValues>({
  name,
  label,
  accept,
  className,
}: FormFileUploadProps<T>) {
  const {
    setValue,
    formState: { errors },
  } = useFormContext<T>();
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const error = errors[name];

  const handleFile = useCallback(
    (file: File | null) => {
      if (file) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(name, file as any, { shouldValidate: true });
        setFileName(file.name);
      }
    },
    [name, setValue],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file ?? null);
    },
    [handleFile],
  );

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-wealth-border hover:border-primary-300",
          error && "border-wealth-danger",
        )}
      >
        <p className="mb-1 text-sm text-wealth-muted">
          {fileName || "Drag & drop a file here, or click to browse"}
        </p>
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="absolute inset-0 cursor-pointer opacity-0"
          style={{ position: "relative" }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-wealth-danger">{error.message as string}</p>}
    </div>
  );
}
