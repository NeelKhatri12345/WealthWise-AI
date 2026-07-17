import { useState } from "react";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface UseRegisterReturn {
  registerUser: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

export const useRegister = (): UseRegisterReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const registerUser = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      void data;
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { registerUser, isLoading, error, isSuccess };
};
