import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  registerSchema,
  type RegisterFormData,
} from "@/forms/schemas/register.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  clearAuthError,
  register as registerUser,
  fetchCurrentUser,
} from "@/store/slices/authSlice";

export default function RegisterPage() {
  useDocumentTitle("Register");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await dispatch(
        registerUser({
          full_name: data.fullName,
          email: data.email,
          password: data.password,
        }),
      ).unwrap();
      navigate(ROUTES.LOGIN, {
        state: { message: "Account created successfully. Please log in." },
      });
    } catch {
      // Thunk error is stored in auth.error and shown via Alert
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create Account
        </h1>
        <p className="mt-1.5 text-sm text-wealth-muted">
          Start your journey toward smarter financial management.
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
          {...register("fullName")}
          id="fullName"
          type="text"
          label="Full Name"
          placeholder="John Doe"
          error={errors.fullName?.message}
          autoComplete="name"
        />

        <Input
          {...register("email")}
          id="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          error={errors.email?.message}
          autoComplete="email"
        />

        <Input
          {...register("password")}
          id="password"
          type="password"
          label="Password"
          placeholder="Create a password"
          error={errors.password?.message}
          autoComplete="new-password"
          helperText="At least 8 characters with uppercase, lowercase, and a number"
        />

        <Input
          {...register("confirmPassword")}
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Create account
        </Button>
      </form>

      {/* Footer Actions */}
      <div className="space-y-4 pt-2 border-t border-wealth-border">
        <p className="text-center text-sm text-wealth-muted">
          Already have an account?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-750 transition-colors"
          >
            Sign In
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