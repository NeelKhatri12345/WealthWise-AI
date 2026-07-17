import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginSchema, type LoginFormData } from "@/forms/schemas/login.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearAuthError, login, fetchCurrentUser } from "@/store/slices/authSlice";

export default function LoginPage() {
  useDocumentTitle("Login");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      await dispatch(login(data)).unwrap();
      await dispatch(fetchCurrentUser()).unwrap();
      navigate(ROUTES.DASHBOARD);
    } catch {
      // Thunk error is stored in auth.error and shown via Alert
    }
  });

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sign In</h1>
        <p className="mt-1.5 text-sm text-wealth-muted">
          Access your personalized financial workspace.
        </p>
      </div>

      {/* Server error */}
      {error && (
        <Alert
          variant="error"
          className="mb-4"
          onClose={() => dispatch(clearAuthError())}
        >
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Email */}
        <Input
          {...register("email")}
          id="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          error={errors.email?.message}
          autoComplete="email"
        />

        {/* Password */}
        <Input
          {...register("password")}
          id="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          autoComplete="current-password"
        />

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-wealth-border text-primary-600 focus:ring-primary-300 cursor-pointer"
            />
            Remember me
          </label>

          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary-600 hover:text-primary-750 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      {/* Footer Actions */}
      <div className="space-y-4 pt-2 border-t border-wealth-border">
        <p className="text-center text-sm text-wealth-muted">
          Don&apos;t have an account?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-primary-600 hover:text-primary-750 transition-colors"
          >
            Create Account
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
