type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
interface UseFileUploadReturn {
    upload: (file: File) => Promise<void>;
    progress: number;
    status: UploadStatus;
    error: string | null;
    reset: () => void;
}
export declare const useFileUpload: () => UseFileUploadReturn;
export {};
