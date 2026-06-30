interface LoginCredentials {
  email: string;
  password: string;
}
interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
export declare const useLogin: () => UseLoginReturn;
export {};
