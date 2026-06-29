export interface UploadResponse {
    id: string;
    fileName: string;
    fileSize: number;
    status: 'processing' | 'completed' | 'failed';
    transactionCount: number;
    uploadedAt: string;
    completedAt?: string;
    errorMessage?: string;
}
export interface UploadStatusResponse {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    transactionCount: number;
    errorMessage?: string;
}
export declare const uploadApi: {
    uploadStatement(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse>;
    getUploadHistory(): Promise<UploadResponse[]>;
    getUploadStatus(id: string): Promise<UploadStatusResponse>;
    deleteUpload(id: string): Promise<void>;
};
