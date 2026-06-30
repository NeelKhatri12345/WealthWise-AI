import { z } from "zod";
export declare const uploadSchema: z.ZodObject<
  {
    file: z.ZodEffects<
      z.ZodEffects<z.ZodType<File, z.ZodTypeDef, File>, File, File>,
      File,
      File
    >;
    description: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    file: File;
    description?: string | undefined;
  },
  {
    file: File;
    description?: string | undefined;
  }
>;
export type UploadFormData = z.infer<typeof uploadSchema>;
