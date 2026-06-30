interface UploadStats {
  totalUploads: number;
  processingCount: number;
  failedCount: number;
  avgUploadSize: string;
  status: "normal" | "busy" | "overloaded";
}
interface UploadMonitorProps {
  stats: UploadStats;
}
export declare const UploadMonitor: ({
  stats,
}: UploadMonitorProps) => import("react").JSX.Element;
export {};
