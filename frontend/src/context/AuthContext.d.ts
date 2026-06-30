import type { User } from "@/types/auth.types";
export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}
export declare const AuthContext: import("react").Context<
  AuthContextValue | undefined
>;
