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
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-wealth-muted">
          Sign in to your WealthWise account
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
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-wealth-border text-primary-600 focus:ring-primary-300"
            />
            Remember me
          </label>

          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-wealth-muted">
        Don&apos;t have an account?{" "}
        <Link
          to={ROUTES.REGISTER}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
