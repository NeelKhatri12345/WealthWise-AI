interface MonitoringData {
  apiEndpoints: Array<{
    path: string;
    method: string;
    avgResponseTime: number;
    requestCount: number;
    errorRate: number;
    status: "healthy" | "degraded" | "down";
  }>;
  systemMetrics: Array<{
    label: string;
    value: number;
    maxValue: number;
    unit: string;
    status: "normal" | "warning" | "critical";
  }>;
  ocrStats: {
    totalProcessed: number;
    successRate: number;
    avgProcessingTime: number;
    queueSize: number;
    status: "running" | "idle" | "error";
  };
  uploadStats: {
    totalUploads: number;
    processingCount: number;
    failedCount: number;
    avgUploadSize: string;
    status: "normal" | "busy" | "overloaded";
  };
  errors: Array<{
    id: string;
    message: string;
    source: string;
    timestamp: string;
    severity: "error" | "warning" | "critical";
    count: number;
  }>;
}
interface UseMonitoringReturn {
  data: MonitoringData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
export declare const useMonitoring: () => UseMonitoringReturn;
export {};
