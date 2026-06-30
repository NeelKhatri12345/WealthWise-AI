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
export declare const useRegister: () => UseRegisterReturn;
export {};
