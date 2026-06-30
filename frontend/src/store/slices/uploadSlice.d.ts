export interface UploadHistoryItem {
    id: string;
    fileName: string;
    fileSize: number;
    status: 'processing' | 'completed' | 'failed';
    transactionCount: number;
    uploadedAt: string;
    completedAt?: string;
    errorMessage?: string;
}
export interface UploadState {
    uploadProgress: number;
    uploadHistory: UploadHistoryItem[];
    currentFile: File | null;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
    error: string | null;
}
export declare const uploadFile: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/upload.api").UploadResponse, File, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchUploadHistory: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/upload.api").UploadResponse[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const setUploadProgress: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "upload/setUploadProgress">, setCurrentFile: import("@reduxjs/toolkit").ActionCreatorWithPayload<File | null, "upload/setCurrentFile">, clearUpload: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"upload/clearUpload">;
declare const _default: import("redux").Reducer<UploadState>;
export default _default;
