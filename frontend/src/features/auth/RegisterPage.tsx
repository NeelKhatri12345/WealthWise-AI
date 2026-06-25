import { Link } from 'react-router-dom';
import { RegisterForm, SocialLogin } from './components';
import { useRegister } from './hooks';

export const RegisterPage = () => {
  const { registerUser, isLoading, error, isSuccess } = useRegister();

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Account created!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please check your email to verify your account.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Start your financial wellness journey
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <RegisterForm onSubmit={registerUser} isLoading={isLoading} />

          <div className="mt-6">
            <SocialLogin />
          </div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
