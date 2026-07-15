import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/forms/schemas/forgotPassword.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  useDocumentTitle("Forgot Password");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = handleSubmit(async () => {
    setServerError(null);
    // No backend — show confirmation after valid submission
    setIsSubmitted(true);
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p className="mt-1 text-sm text-wealth-muted">
          Enter your email and we&apos;ll send you reset instructions
        </p>
      </div>

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

      {isSubmitted ? (
        <Alert variant="success" className="mb-4">
          Check your email for a password reset link.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Input
            {...register("email")}
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email?.message}
            autoComplete="email"
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}

      {/* Footer Actions */}
      <div className="space-y-4 pt-4 border-t border-wealth-border mt-6">
        <p className="text-center text-sm text-wealth-muted">
          Remember your password?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-750 transition-colors"
          >
            Sign in
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
