import axiosInstance, { type ApiResponse } from "./axiosInstance";

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

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials,
    );
    return data.data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload,
    );
    return data.data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout");
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    const { data } = await axiosInstance.post<
      ApiResponse<{ token: string; refreshToken: string }>
    >("/auth/refresh", { refreshToken });
    return data.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      { email },
    );
    return data.data;
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const { data } = await axiosInstance.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      { token, password },
    );
    return data.data;
  },

  async updateProfile(
    payload: ProfileUpdateRequest,
  ): Promise<AuthResponse["user"]> {
    const { data } = await axiosInstance.patch<
      ApiResponse<AuthResponse["user"]>
    >("/auth/profile", payload);
    return data.data;
  },
};
