import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/forms/schemas/resetPassword.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { authService } from "@/services/auth.service";

export default function ResetPasswordPage() {
  useDocumentTitle("Reset Password");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!token) {
      setServerError("Reset token is missing from the URL.");
      return;
    }
    setServerError(null);
    try {
      await authService.resetPassword({
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="mt-1 text-sm text-wealth-muted">
          Please enter your new password below.
        </p>
      </div>

      {/* Token validation error */}
      {!token && (
        <Alert variant="error" className="mb-4">
          Reset token is missing. Please check your email link or request a new one.
        </Alert>
      )}

      {/* Server error */}
      {serverError && (
        <Alert
          variant="error"
          className="mb-4"
          onClose={() => setServerError(null)}
        >
          {serverError}
        </Alert>
      )}

      {isSuccess ? (
        <div className="space-y-4">
          <Alert variant="success" className="mb-4">
            Your password has been successfully reset.
          </Alert>
          <Button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="w-full"
          >
            Go to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Input
            {...register("password")}
            id="password"
            type="password"
            label="New Password"
            placeholder="••••••••"
            error={errors.password?.message}
            autoComplete="new-password"
            disabled={!token}
          />

          <Input
            {...register("confirmPassword")}
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            disabled={!token}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!token}
          >
            Reset password
          </Button>
        </form>
      )}

      {/* Footer Actions */}
      <div className="space-y-4 pt-4 border-t border-wealth-border mt-6">
        <p className="text-center text-sm text-wealth-muted">
          Remembered your password?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-750 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
