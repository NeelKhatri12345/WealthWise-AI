import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginSchema, type LoginFormData } from "@/forms/schemas/login.schema";
import { ROUTES } from "@/routes/routes";
import { UserRole } from "@/constants/roles";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearAuthError, login, fetchCurrentUser } from "@/store/slices/authSlice";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  useDocumentTitle("Admin Login");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user?.role === UserRole.ADMIN) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await dispatch(login(data)).unwrap();
      const currentUser = await dispatch(fetchCurrentUser()).unwrap();
      if (currentUser.role === UserRole.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        navigate(ROUTES.UNAUTHORIZED);
      }
    } catch {
      // Thunk error is stored in auth.error and shown via Alert
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Sign In</h1>
        <p className="mt-1.5 text-sm text-wealth-muted">
          Restricted access for WealthWise administrators.
        </p>
      </div>

      {error && (
        <Alert
          variant="error"
          className="mb-4"
          onClose={() => dispatch(clearAuthError())}
        >
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          {...register("email")}
          id="admin-email"
          type="email"
          label="Email address"
          placeholder="admin@example.com"
          error={errors.email?.message}
          autoComplete="email"
        />

        <Input
          {...register("password")}
          id="admin-password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          autoComplete="current-password"
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Sign in to Admin Panel
        </Button>
      </form>

      <div className="space-y-4 pt-2 border-t border-wealth-border">
        <p className="text-center text-sm text-wealth-muted">
          Not an administrator?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-750 transition-colors"
          >
            User Sign In
          </Link>
        </p>

        <div className="text-center">
          <Link
            to={ROUTES.HOME}
            className="text-xs font-semibold text-wealth-muted hover:text-primary-600 transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
