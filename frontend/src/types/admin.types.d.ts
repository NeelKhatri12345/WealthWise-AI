export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalTransactions: number;
  systemUptime: number;
  storageUsed: number;
}
export interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  services: ServiceStatus[];
  lastChecked: string;
}
export interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded";
  latency: number;
  uptime: number;
}
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}
