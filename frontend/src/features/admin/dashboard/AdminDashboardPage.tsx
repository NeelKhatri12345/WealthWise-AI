import {
  SystemOverview,
  UserGrowthChart,
  ActiveUsersChart,
  RevenueChart,
  RecentActivity,
} from "./components";
import { useAdminDashboard } from "./hooks";

export const AdminDashboardPage = () => {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error ?? "Failed to load admin dashboard"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          System overview and key metrics
        </p>
      </div>

      <SystemOverview stats={data.systemStats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserGrowthChart data={data.userGrowth} />
        <ActiveUsersChart data={data.activeUsers} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={data.revenue} />
        <RecentActivity activities={data.recentActivity} />
      </div>
    </div>
  );
};
