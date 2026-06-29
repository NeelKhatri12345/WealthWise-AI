import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loginSchema, type LoginFormData } from "@/forms/schemas/login.schema";
import { ROUTES } from "@/routes/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  useDocumentTitle("Login");

  // Server-side error state — will be populated when auth is wired up
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Placeholder submit handler — no API call yet
  const onSubmit = handleSubmit(async (_data) => {
    setServerError(null);
    // TODO: Wire up authentication API call
    // Example:
    // try {
    //   await dispatch(login(_data)).unwrap();
    //   navigate(ROUTES.DASHBOARD);
    // } catch (err) {
    //   setServerError(err.message);
    // }
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
      {serverError && (
        <Alert
          variant="error"
          className="mb-4"
          onClose={() => setServerError(null)}
        >
          {serverError}
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
            to="#"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
        >
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
