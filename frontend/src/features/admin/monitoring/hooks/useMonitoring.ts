import { useState, useEffect } from "react";

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

export const useMonitoring = (): UseMonitoringReturn => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        apiEndpoints: [],
        systemMetrics: [
          {
            label: "CPU",
            value: 42,
            maxValue: 100,
            unit: "%",
            status: "normal",
          },
          {
            label: "Memory",
            value: 6.2,
            maxValue: 16,
            unit: "GB",
            status: "normal",
          },
          {
            label: "Disk",
            value: 120,
            maxValue: 500,
            unit: "GB",
            status: "normal",
          },
        ],
        ocrStats: {
          totalProcessed: 15420,
          successRate: 97.8,
          avgProcessingTime: 3.2,
          queueSize: 0,
          status: "idle",
        },
        uploadStats: {
          totalUploads: 8920,
          processingCount: 0,
          failedCount: 12,
          avgUploadSize: "2.4MB",
          status: "normal",
        },
        errors: [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load monitoring data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
};
