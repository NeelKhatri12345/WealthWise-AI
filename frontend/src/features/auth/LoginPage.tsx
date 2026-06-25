import { Link } from 'react-router-dom';
import { LoginForm, SocialLogin } from './components';
import { useLogin } from './hooks';

export const LoginPage = () => {
  const { login, isLoading, error } = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your WealthWise account
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <LoginForm onSubmit={login} isLoading={isLoading} />

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6">
            <SocialLogin />
          </div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
