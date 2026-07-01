import { z } from "zod";
import { appConfig } from "@/config/app.config";

export const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine(
      (f) => f.size <= appConfig.maxFileSize,
      `File size must be less than ${appConfig.maxFileSize / (1024 * 1024)}MB`,
    )
    .refine(
      (f) =>
        appConfig.supportedFileTypes.some((ext) =>
          f.name.toLowerCase().endsWith(ext),
        ),
      `Supported file types: ${appConfig.supportedFileTypes.join(", ")}`,
    ),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional(),
});

export type UploadFormData = z.infer<typeof uploadSchema>;
