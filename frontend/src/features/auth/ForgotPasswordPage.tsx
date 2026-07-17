import { useState } from "react";
import { Link } from "react-router-dom";
import { ForgotPasswordForm } from "./components";

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ll send you instructions to reset your password
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {isSubmitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Check your email for a password reset link.
              </p>
            </div>
          ) : (
            <ForgotPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
          )}
        </div>

        <p className="text-center text-sm text-gray-600">
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};
