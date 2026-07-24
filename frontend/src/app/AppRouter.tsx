import React, { Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
const ResetPasswordPage = React.lazy(
  () => import("@/pages/auth/ResetPasswordPage"),
);
const DashboardPage = React.lazy(
  () => import("@/pages/dashboard/DashboardPage"),
);
const UploadPage = React.lazy(() => import("@/pages/upload/UploadPage"));
const StatementReviewPage = React.lazy(
  () => import("@/pages/upload/StatementReviewPage"),
);

const TransactionsPage = React.lazy(
  () => import("@/pages/transactions/TransactionsPage"),
);

const HealthScorePage = React.lazy(
  () => import("@/pages/health/HealthScorePage"),
);

const FinancialProfileChatPage = React.lazy(
  () => import("@/pages/financial-profile/FinancialProfileChatPage"),
);

// const RiskProfilePage = React.lazy(
//   () => import("@/pages/risk/RiskProfilePage"),
// );

// const PortfolioPage = React.lazy(
//   () => import("@/pages/portfolio/PortfolioPage"),
// );

// const PortfolioHoldingsPage = React.lazy(
//   () => import("@/pages/portfolio-holdings/PortfolioHoldingsPage"),
// );

const AICoachPage = React.lazy(
  () => import("@/pages/ai-coach/AICoachPage"),
);

const InvestmentPlanPage = React.lazy(
  () => import("@/pages/investment-plan/InvestmentPlanPage"),
);

// const ReportsPage = React.lazy(
//   () => import("@/pages/reports/ReportsPage"),
// );

// const NotificationsPage = React.lazy(
//   () => import("@/pages/notifications/NotificationsPage"),
// );

const LandingPage = React.lazy(
  () => import("@/pages/landing/LandingPage"),
);

const ProfilePage = React.lazy(
  () => import("@/pages/profile/ProfilePage"),
);

const SettingsPage = React.lazy(
  () => import("@/pages/settings/SettingsPage"),
);

const AdminLoginPage = React.lazy(
  () => import("@/pages/admin/AdminLoginPage"),
);

const AdminDashboardPage = React.lazy(
  () => import("@/pages/admin/AdminDashboardPage"),
);

const AdminUsersPage = React.lazy(
  () => import("@/pages/admin/AdminUsersPage"),
);

const AdminActivityPage = React.lazy(
  () => import("@/pages/admin/AdminActivityPage"),
);

const AdminAuditPage = React.lazy(
  () => import("@/pages/admin/AdminAuditPage"),
);

const NotFoundPage = React.lazy(
  () => import("@/pages/NotFound"),
);

const UnauthorizedPage = React.lazy(
  () => import("@/pages/Unauthorized"),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public landing page */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />

          {/* Public auth routes */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route
                path={ROUTES.FORGOT_PASSWORD}
                element={<ForgotPasswordPage />}
              />
              <Route
                path={ROUTES.RESET_PASSWORD}
                element={<ResetPasswordPage />}
              />
            </Route>
          </Route>

          {/* Protected user routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.UPLOAD} element={<UploadPage />} />
              <Route
                path={ROUTES.STATEMENT_REVIEW}
                element={<StatementReviewPage />}
              />

              <Route
                path={ROUTES.TRANSACTIONS}
                element={<TransactionsPage />}
              />

              <Route
                path={ROUTES.FINANCIAL_PROFILE}
                element={<FinancialProfileChatPage />}
              />

              <Route
                path={ROUTES.HEALTH_SCORE}
                element={<HealthScorePage />}
              />

              {/* Redirect deprecated Risk Profile page */}
              <Route
                path={ROUTES.RISK_PROFILE}
                element={<Navigate to={ROUTES.HEALTH_SCORE} replace />}
              />

              {/* <Route
                path={ROUTES.PORTFOLIO}
                element={<PortfolioPage />}
              />

              <Route
                path={ROUTES.PORTFOLIO_HOLDINGS}
                element={<PortfolioHoldingsPage />}
              /> */}

              <Route path={ROUTES.AI_COACH} element={<AICoachPage />} />

              <Route
                path={ROUTES.INVESTMENT_PLAN}
                element={<InvestmentPlanPage />}
              />

              {/* <Route
                path={ROUTES.REPORTS}
                element={<ReportsPage />}
              />

              <Route
                path={ROUTES.NOTIFICATIONS}
                element={<NotificationsPage />}
              /> */}

              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin login (separate from public user auth redirect) */}
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route
                path="/admin"
                element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />}
              />
              <Route
                path={ROUTES.ADMIN_DASHBOARD}
                element={<AdminDashboardPage />}
              />
              <Route
                path={ROUTES.ADMIN_USERS}
                element={<AdminUsersPage />}
              />
              <Route
                path={ROUTES.ADMIN_ACTIVITY}
                element={<AdminActivityPage />}
              />
              <Route
                path={ROUTES.ADMIN_AUDIT}
                element={<AdminAuditPage />}
              />
            </Route>
          </Route>

          {/* Error routes */}
          <Route
            path={ROUTES.UNAUTHORIZED}
            element={<UnauthorizedPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}