interface AdminDashboardData {
  systemStats: Array<{
    label: string;
    value: string | number;
    status: "healthy" | "warning" | "critical";
  }>;
  userGrowth: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
  activeUsers: Array<{
    time: string;
    count: number;
  }>;
  revenue: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: "user" | "system" | "security";
  }>;
}
interface UseAdminDashboardReturn {
  data: AdminDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
export declare const useAdminDashboard: () => UseAdminDashboardReturn;
export {};
