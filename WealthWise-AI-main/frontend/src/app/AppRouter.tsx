import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { AdminRoute } from "@/routes/AdminRoute";
import { PublicRoute } from "@/routes/PublicRoute";
import { MainLayout } from "@/layouts/MainLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = React.lazy(
  () => import("@/pages/auth/ForgotPasswordPage"),
);
const DashboardPage = React.lazy(
  () => import("@/pages/dashboard/DashboardPage"),
);
const UploadPage = React.lazy(() => import("@/pages/upload/UploadPage"));
const TransactionsPage = React.lazy(
  () => import("@/pages/transactions/TransactionsPage"),
);
const HealthScorePage = React.lazy(
  () => import("@/pages/health/HealthScorePage"),
);
const RiskProfilePage = React.lazy(
  () => import("@/pages/risk/RiskProfilePage"),
);
const PortfolioPage = React.lazy(
  () => import("@/pages/portfolio/PortfolioPage"),
);
const AICoachPage = React.lazy(() => import("@/pages/coach/AICoachPage"));
const ReportsPage = React.lazy(() => import("@/pages/reports/ReportsPage"));
const NotificationsPage = React.lazy(
  () => import("@/pages/notifications/NotificationsPage"),
);
const ProfilePage = React.lazy(() => import("@/pages/profile/ProfilePage"));
const SettingsPage = React.lazy(() => import("@/pages/settings/SettingsPage"));
const AdminDashboardPage = React.lazy(
  () => import("@/pages/admin/AdminDashboardPage"),
);
const AdminUsersPage = React.lazy(() => import("@/pages/admin/AdminUsersPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFound"));
const UnauthorizedPage = React.lazy(() => import("@/pages/Unauthorized"));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public auth routes */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route
                path={ROUTES.FORGOT_PASSWORD}
                element={<ForgotPasswordPage />}
              />
            </Route>
          </Route>

          {/* Protected user routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path={ROUTES.HOME} element={<DashboardPage />} />
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.UPLOAD} element={<UploadPage />} />
              <Route
                path={ROUTES.TRANSACTIONS}
                element={<TransactionsPage />}
              />
              <Route path={ROUTES.HEALTH_SCORE} element={<HealthScorePage />} />
              <Route path={ROUTES.RISK_PROFILE} element={<RiskProfilePage />} />
              <Route path={ROUTES.PORTFOLIO} element={<PortfolioPage />} />
              <Route path={ROUTES.AI_COACH} element={<AICoachPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route
                path={ROUTES.NOTIFICATIONS}
                element={<NotificationsPage />}
              />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route
                path={ROUTES.ADMIN_DASHBOARD}
                element={<AdminDashboardPage />}
              />
              <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
            </Route>
          </Route>

          {/* Error routes */}
          <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
