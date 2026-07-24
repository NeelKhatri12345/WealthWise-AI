import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import { Card } from "@/components/ui/Card";

import { StatCard } from "@/pages/dashboard/components/StatCard";

import { ROUTES } from "@/routes/routes";

import {

  adminApi,

  type AdminAnalyticsResponse,

  type AdminStatsResponse,

  type AnalyticsMetricPoint,

  type SystemMonitoringResponse,

} from "@/services/api/admin.api";

import {

  DailyTrendChart,

  HealthScoreTrendChart,

  RiskProfileChart,

} from "@/charts/admin";

import { CHART_COLORS } from "@/charts/common/chartColors";

import { AdminActivityTable } from "./components/AdminActivityTable";

import { SystemMonitoringPanel } from "./components/SystemMonitoringPanel";



const statIcons = {

  users: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />

    </svg>

  ),

  active: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

    </svg>

  ),

  statements: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />

    </svg>

  ),

  chats: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />

    </svg>

  ),

  plans: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />

    </svg>

  ),

  dau: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />

    </svg>

  ),

  health: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />

    </svg>

  ),

  risk: (

    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">

      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />

    </svg>

  ),

};



function formatCount(value: number): string {

  return value.toLocaleString("en-IN");

}



function formatChartDate(isoDate: string): string {

  const date = new Date(`${isoDate}T00:00:00`);

  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

}



function toTrendData(points: AnalyticsMetricPoint[]) {

  return {

    categories: points.map((p) => formatChartDate(p.date)),

    values: points.map((p) => p.value),

  };

}



function formatRiskLabel(label: string): string {

  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

}



export default function AdminDashboardPage() {

  useDocumentTitle("Admin Dashboard");



  const [stats, setStats] = useState<AdminStatsResponse | null>(null);

  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);

  const [monitoring, setMonitoring] = useState<SystemMonitoringResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [monitoringLoading, setMonitoringLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [monitoringError, setMonitoringError] = useState<string | null>(null);



  const loadMonitoring = async () => {

    setMonitoringLoading(true);

    setMonitoringError(null);

    try {

      const data = await adminApi.getSystemMonitoring();

      setMonitoring(data);

    } catch {

      setMonitoringError("Failed to load system monitoring status.");

    } finally {

      setMonitoringLoading(false);

    }

  };



  const loadDashboard = async () => {

    setLoading(true);

    setError(null);

    try {

      const [statsData, analyticsData] = await Promise.all([

        adminApi.getAdminStats(),

        adminApi.getAdminAnalytics(7),

      ]);

      setStats(statsData);

      setAnalytics(analyticsData);

    } catch {

      setError("Failed to load admin statistics.");

    } finally {

      setLoading(false);

    }

  };



  const loadAll = async () => {

    await Promise.all([loadDashboard(), loadMonitoring()]);

  };



  useEffect(() => {

    void loadAll();

  }, []);



  const dauTrend = useMemo(

    () => (analytics ? toTrendData(analytics.daily_active_users_trend) : { categories: [], values: [] }),

    [analytics],

  );

  const aiTrend = useMemo(

    () => (analytics ? toTrendData(analytics.ai_requests_trend) : { categories: [], values: [] }),

    [analytics],

  );

  const statementsTrend = useMemo(

    () => (analytics ? toTrendData(analytics.statements_trend) : { categories: [], values: [] }),

    [analytics],

  );

  const healthTrend = useMemo(

    () =>

      analytics

        ? {

            categories: analytics.health_score_trend.map((p) => formatChartDate(p.date)),

            scores: analytics.health_score_trend.map((p) => p.value),

          }

        : { categories: [], scores: [] },

    [analytics],

  );

  const riskDistribution = useMemo(

    () =>

      analytics

        ? {

            labels: analytics.risk_profile_distribution.map((p) => formatRiskLabel(p.label)),

            values: analytics.risk_profile_distribution.map((p) => p.value),

          }

        : { labels: [], values: [] },

    [analytics],

  );



  return (

    <div className="animate-fade-in space-y-8">

      <PageHeader

        title="Admin Dashboard"

        description="System overview and platform metrics"

      />



      <section className="space-y-4">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>

          <p className="text-sm text-wealth-muted">Key platform metrics (last 7 days for trends)</p>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard

            title="Daily Active Users"

            value={analytics ? formatCount(analytics.daily_active_users) : "—"}

            icon={statIcons.dau}

            iconBg="bg-sky-50 text-sky-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Total AI Requests"

            value={analytics ? formatCount(analytics.total_ai_requests) : "—"}

            icon={statIcons.chats}

            iconBg="bg-violet-50 text-violet-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Total Statements Uploaded"

            value={analytics ? formatCount(analytics.total_statements_uploaded) : "—"}

            icon={statIcons.statements}

            iconBg="bg-indigo-50 text-indigo-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Average Health Score"

            value={

              analytics?.average_health_score != null

                ? analytics.average_health_score.toFixed(1)

                : "—"

            }

            icon={statIcons.health}

            iconBg="bg-emerald-50 text-emerald-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Average Risk Profile"

            value={analytics?.average_risk_profile ?? "—"}

            icon={statIcons.risk}

            iconBg="bg-amber-50 text-amber-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

        </div>



        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">

          <Card padding="md" className="border-wealth-border space-y-3">

            <h3 className="text-sm font-semibold text-gray-900">Daily Active Users</h3>

            <DailyTrendChart

              data={dauTrend}

              seriesName="Active Users"

              color={CHART_COLORS.info}

              yAxisTitle="Users"

              loading={loading}

              error={error}

            />

          </Card>

          <Card padding="md" className="border-wealth-border space-y-3">

            <h3 className="text-sm font-semibold text-gray-900">AI Requests</h3>

            <DailyTrendChart

              data={aiTrend}

              seriesName="AI Requests"

              color={CHART_COLORS.primary}

              yAxisTitle="Requests"

              loading={loading}

              error={error}

            />

          </Card>

          <Card padding="md" className="border-wealth-border space-y-3">

            <h3 className="text-sm font-semibold text-gray-900">Statement Uploads</h3>

            <DailyTrendChart

              data={statementsTrend}

              seriesName="Uploads"

              color={CHART_COLORS.accent}

              yAxisTitle="Uploads"

              loading={loading}

              error={error}

            />

          </Card>

          <Card padding="md" className="border-wealth-border space-y-3">

            <h3 className="text-sm font-semibold text-gray-900">Avg Health Score Trend</h3>

            <HealthScoreTrendChart

              data={healthTrend}

              loading={loading}

              error={error}

            />

          </Card>

          <Card padding="md" className="border-wealth-border space-y-3 lg:col-span-2 xl:col-span-2">

            <h3 className="text-sm font-semibold text-gray-900">Risk Profile Distribution</h3>

            <RiskProfileChart

              data={riskDistribution}

              loading={loading}

              error={error}

            />

          </Card>

        </div>

      </section>



      <section className="space-y-4">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>

          <p className="text-sm text-wealth-muted">All-time platform totals</p>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard

            title="Total Users"

            value={stats ? formatCount(stats.total_users) : "—"}

            icon={statIcons.users}

            iconBg="bg-primary-50 text-primary-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Active Users"

            value={stats ? formatCount(stats.active_users) : "—"}

            icon={statIcons.active}

            iconBg="bg-emerald-50 text-emerald-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Total Statements"

            value={stats ? formatCount(stats.total_statements) : "—"}

            icon={statIcons.statements}

            iconBg="bg-indigo-50 text-indigo-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Total AI Chats"

            value={stats ? formatCount(stats.total_ai_chats) : "—"}

            icon={statIcons.chats}

            iconBg="bg-violet-50 text-violet-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

          <StatCard

            title="Total Investment Plans"

            value={stats ? formatCount(stats.total_investment_plans) : "—"}

            icon={statIcons.plans}

            iconBg="bg-amber-50 text-amber-600"

            loading={loading}

            error={error}

            onRetry={loadDashboard}

          />

        </div>

      </section>



      <section className="space-y-4">

        <div className="flex items-center justify-between gap-3">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">System Monitoring</h2>

            <p className="text-sm text-wealth-muted">

              Infrastructure and external API connectivity

            </p>

          </div>

          <button

            type="button"

            onClick={() => void loadMonitoring()}

            disabled={monitoringLoading}

            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"

          >

            Refresh

          </button>

        </div>

        <SystemMonitoringPanel

          services={monitoring?.services ?? []}

          checkedAt={monitoring?.checked_at ?? null}

          loading={monitoringLoading}

          error={monitoringError}

          onRetry={() => void loadMonitoring()}

        />

      </section>



      <Card padding="md" className="border-wealth-border space-y-4">

        <div className="flex items-center justify-between gap-3">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>

            <p className="text-sm text-wealth-muted">Latest platform events</p>

          </div>

          <Link

            to={ROUTES.ADMIN_ACTIVITY}

            className="text-sm font-medium text-primary-600 hover:text-primary-700"

          >

            View all →

          </Link>

        </div>

        <AdminActivityTable compact />

      </Card>

    </div>

  );

}


