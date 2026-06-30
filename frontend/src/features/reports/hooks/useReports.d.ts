interface Report {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  generatedAt: string;
  status: "ready" | "generating" | "failed";
}
interface UseReportsReturn {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  generateReport: (data: {
    type: string;
    dateFrom: string;
    dateTo: string;
  }) => Promise<void>;
  downloadReport: (id: string, format: "pdf" | "csv") => Promise<void>;
  refetch: () => void;
}
export declare const useReports: () => UseReportsReturn;
export {};
