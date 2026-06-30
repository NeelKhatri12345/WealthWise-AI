interface AuditEntry {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
  status: "success" | "failure";
  details?: Record<string, unknown>;
  userAgent?: string;
}
interface UseAuditLogsReturn {
  entries: AuditEntry[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
export declare const useAuditLogs: (
  page?: number,
  filters?: {
    action?: string;
    user?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  },
) => UseAuditLogsReturn;
export {};
