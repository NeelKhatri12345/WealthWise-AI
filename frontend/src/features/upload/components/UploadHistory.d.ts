interface UploadRecord {
  id: string;
  fileName: string;
  uploadDate: string;
  status: "completed" | "processing" | "failed";
  transactionCount?: number;
}
interface UploadHistoryProps {
  uploads: UploadRecord[];
  onRetry?: (id: string) => void;
}
export declare const UploadHistory: ({
  uploads,
  onRetry,
}: UploadHistoryProps) => import("react").JSX.Element;
export {};
