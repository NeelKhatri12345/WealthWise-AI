/**
 * WealthWise AI — Upload API Service
 *
 * Matches the backend endpoint exactly:
 *   POST /statements/upload  (multipart/form-data, field name: "file")
 *   GET  /statements/          (list with skip/limit)
 *   GET  /statements/{id}      (single statement detail)
 *   DELETE /statements/{id}    (delete statement + MinIO file)
 *
 * Backend response envelope: { success, message, data: T }
 * All snake_case → camelCase mapping is done here so the rest of
 * the frontend uses consistent camelCase types.
 */

import axiosInstance, { type ApiResponse } from "./axiosInstance";

// ---------------------------------------------------------------------------
// Types — mirroring the backend StatementUploadResponse / StatementStatusResponse
// ---------------------------------------------------------------------------

/**
 * Possible lifecycle states returned by the backend.
 * Must stay in sync with backend StatementStatusEnum (app/enums/statement_status_enum.py).
 */
export type StatementStatus =
  | "pending"
  | "uploaded"
  | "processing"
  | "ocr_completed"
  | "parsing"
  | "completed"
  | "failed";

/** Statuses where the pipeline is still running — not yet safe to reparse/accept. */
export const IN_PROGRESS_STATEMENT_STATUSES: StatementStatus[] = [
  "pending",
  "uploaded",
  "processing",
];

/**
 * Returned immediately after a successful POST /statements/upload (HTTP 202).
 * Maps directly to the backend StatementUploadResponse schema.
 */
export interface UploadedDocument {
  id: string;
  /** Original filename as submitted by the client. */
  fileName: string;
  /** Extension without the dot: pdf | png | jpg | jpeg */
  fileType: string;
  /** File size in bytes. */
  fileSizeBytes: number | null;
  /** MinIO object key — useful for debugging / presigned URLs. */
  minioKey: string;
  /** Upload status — always "pending" on initial upload. */
  status: StatementStatus;
  createdAt: string;
}

/**
 * Full detail response for GET /statements/{id}.
 * Extends UploadedDocument with processing metadata.
 */
export interface StatementDetail extends UploadedDocument {
  errorMessage: string | null;
  processedAt: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Raw backend shapes (snake_case) — used only for deserialization
// ---------------------------------------------------------------------------

interface RawUploadedDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number | null;
  minio_key: string;
  status: StatementStatus;
  created_at: string;
}

interface RawStatementDetail extends RawUploadedDocument {
  error_message: string | null;
  processed_at: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapUploadedDocument(raw: RawUploadedDocument): UploadedDocument {
  return {
    id: raw.id,
    fileName: raw.file_name,
    fileType: raw.file_type,
    fileSizeBytes: raw.file_size_bytes,
    minioKey: raw.minio_key,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

function mapStatementDetail(raw: RawStatementDetail): StatementDetail {
  return {
    ...mapUploadedDocument(raw),
    errorMessage: raw.error_message,
    processedAt: raw.processed_at,
    updatedAt: raw.updated_at,
  };
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const uploadService = {
  /**
   * Upload a bank statement file to the backend.
   *
   * Sends multipart/form-data with the file under the field name "file".
   * Calls onProgress with 0-100 integer values as the upload progresses.
   *
   * Returns HTTP 202 with status="pending" on success.
   *
   * @throws AxiosError with response.data.message on 413 / 415 / 401 / 403
   */
  async uploadStatement(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadedDocument> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosInstance.post<
      ApiResponse<RawUploadedDocument>
    >("/statements/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
    });

    return mapUploadedDocument(data.data);
  },

  /**
   * List all statements for the authenticated user.
   */
  async listStatements(
    skip = 0,
    limit = 20,
  ): Promise<StatementDetail[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<RawStatementDetail[]>
    >("/statements/", { params: { skip, limit } });

    return data.data.map(mapStatementDetail);
  },

  /**
   * Fetch a single statement's status and metadata.
   */
  async getStatement(id: string): Promise<StatementDetail> {
    const { data } = await axiosInstance.get<ApiResponse<RawStatementDetail>>(
      `/statements/${id}`,
    );
    return mapStatementDetail(data.data);
  },

  /**
   * Delete a statement (removes the MinIO file and DB record).
   */
  async deleteStatement(id: string): Promise<void> {
    await axiosInstance.delete(`/statements/${id}`);
  },

  /**
   * Re-run the transaction parser for a statement.
   */
  async reparseStatement(id: string): Promise<void> {
    await axiosInstance.post(`/statements/${id}/processing/reparse`);
  },

  /**
   * Mark statement processing as complete.
   */
  async completeStatement(id: string): Promise<StatementDetail> {
    const { data } = await axiosInstance.post<ApiResponse<RawStatementDetail>>(
      `/statements/${id}/processing/complete`,
    );
    return mapStatementDetail(data.data);
  },
};
