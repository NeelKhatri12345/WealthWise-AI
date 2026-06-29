interface UploadProgressProps {
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    errorMessage?: string;
    onCancel?: () => void;
}
export declare const UploadProgress: ({ fileName, progress, status, errorMessage, onCancel, }: UploadProgressProps) => import("react").JSX.Element;
export {};
