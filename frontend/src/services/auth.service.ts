import axiosInstance, { type ApiResponse } from "./api/axiosInstance";

/** JWT pair returned by register, login, and refresh. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

/** Shape returned by GET /api/v1/users/me (matches backend UserResponse). */
export interface CurrentUserResponse {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data } = await axiosInstance.post<ApiResponse<TokenResponse>>(
      "/auth/login",
      credentials,
    );
    return data.data;
  },

  async register(payload: RegisterRequest): Promise<TokenResponse> {
    const { data } = await axiosInstance.post<ApiResponse<TokenResponse>>(
      "/auth/register",
      payload,
    );
    return data.data;
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const { data } = await axiosInstance.post<ApiResponse<TokenResponse>>(
      "/auth/refresh",
      { refresh_token: refreshToken } satisfies RefreshTokenRequest,
    );
    return data.data;
  },

  async logout(): Promise<LogoutResponse> {
    const { data } = await axiosInstance.post<ApiResponse<null>>("/auth/logout");
    return { success: data.success, message: data.message };
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } = await axiosInstance.get<ApiResponse<CurrentUserResponse>>(
      "/users/me",
    );
    return data.data;
  },

  async updateProfile(payload: { full_name: string; phone?: string | null }): Promise<CurrentUserResponse> {
    const { data } = await axiosInstance.patch<ApiResponse<CurrentUserResponse>>(
      "/users/me",
      payload,
    );
    return data.data;
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<void> {
    await axiosInstance.post<ApiResponse<null>>(
      "/users/me/change-password",
      payload,
    );
  },
};
