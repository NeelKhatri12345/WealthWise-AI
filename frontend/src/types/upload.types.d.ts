export interface UploadResponse {
  id: string;
  fileName: string;
  fileSize: number;
  status: "processing" | "completed" | "failed";
  transactionsImported: number;
  transactionsSkipped: number;
  errors: UploadError[];
  createdAt: string;
}
export interface UploadError {
  row: number;
  field: string;
  message: string;
}
export interface FileValidation {
  isValid: boolean;
  fileType: string;
  fileSize: number;
  errors: string[];
}
export type UploadStatus =
  "idle" | "uploading" | "processing" | "success" | "error";
