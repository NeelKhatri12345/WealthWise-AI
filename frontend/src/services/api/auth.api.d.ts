export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: "user" | "admin";
    createdAt: string;
  };
  token: string;
  refreshToken: string;
}
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}
export declare const authApi: {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(payload: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }>;
  forgotPassword(email: string): Promise<{
    message: string;
  }>;
  resetPassword(
    token: string,
    password: string,
  ): Promise<{
    message: string;
  }>;
  updateProfile(payload: ProfileUpdateRequest): Promise<AuthResponse["user"]>;
};
