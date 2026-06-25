import { useState } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useLogin = (): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      const _response: LoginResponse = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              token: 'mock-token',
              user: { id: '1', name: 'User', email: credentials.email, role: 'user' },
            }),
          1000,
        ),
      );
      // Store token and redirect after integration
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
