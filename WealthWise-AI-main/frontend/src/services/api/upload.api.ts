import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface UploadResponse {
  id: string;
  fileName: string;
  fileSize: number;
  status: "processing" | "completed" | "failed";
  transactionCount: number;
  uploadedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface UploadStatusResponse {
  id: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  transactionCount: number;
  errorMessage?: string;
}

export const uploadApi = {
  async uploadStatement(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/statement",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total && onProgress) {
            const pct = Math.round((event.loaded * 100) / event.total);
            onProgress(pct);
          }
        },
      },
    );
    return data.data;
  },

  async getUploadHistory(): Promise<UploadResponse[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<UploadResponse[]>>("/upload/history");
    return data.data;
  },

  async getUploadStatus(id: string): Promise<UploadStatusResponse> {
    const { data } = await axiosInstance.get<ApiResponse<UploadStatusResponse>>(
      `/upload/${id}/status`,
    );
    return data.data;
  },

  async deleteUpload(id: string): Promise<void> {
    await axiosInstance.delete(`/upload/${id}`);
  },
};
