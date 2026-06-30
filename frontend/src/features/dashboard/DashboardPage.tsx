import {
  WelcomeCard,
  QuickStats,
  RecentTransactions,
  HealthScoreWidget,
  RiskProfileWidget,
  SpendingChart,
} from "./components";
import { useDashboardData } from "./hooks";

export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>Failed to load dashboard: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const quickStats = [
    {
      label: "Total Balance",
      value: `$${data.stats?.totalBalance.toLocaleString() ?? "0"}`,
      change: 5.2,
      icon: <span className="text-lg">$</span>,
    },
    {
      label: "Monthly Income",
      value: `$${data.stats?.monthlyIncome.toLocaleString() ?? "0"}`,
      change: 2.1,
      icon: <span className="text-lg">&uarr;</span>,
    },
    {
      label: "Monthly Expenses",
      value: `$${data.stats?.monthlyExpenses.toLocaleString() ?? "0"}`,
      change: -3.4,
      icon: <span className="text-lg">&darr;</span>,
    },
    {
      label: "Savings Rate",
      value: `${data.stats?.savingsRate ?? 0}%`,
      change: 1.8,
      icon: <span className="text-lg">%</span>,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <WelcomeCard userName="User" netWorth={data.stats?.totalBalance} />

      <QuickStats stats={quickStats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart data={data.spendingData} />
        </div>
        <div className="space-y-4">
          <HealthScoreWidget score={data.healthScore} />
          <RiskProfileWidget
            riskLevel={data.riskLevel}
            riskScore={data.riskScore}
          />
        </div>
      </div>

      <RecentTransactions transactions={data.recentTransactions} />
    </div>
  );
};
