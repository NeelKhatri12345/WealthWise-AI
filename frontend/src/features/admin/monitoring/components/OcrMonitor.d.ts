interface OcrStats {
  totalProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  queueSize: number;
  status: "running" | "idle" | "error";
}
interface OcrMonitorProps {
  stats: OcrStats;
}
export declare const OcrMonitor: ({
  stats,
}: OcrMonitorProps) => import("react").JSX.Element;
export {};
