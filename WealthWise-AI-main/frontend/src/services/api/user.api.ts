import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface UserProfileResponse {
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

export interface UserUpdateRequest {
  full_name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export const userApi = {
  async getProfile(): Promise<UserProfileResponse> {
    const { data } = await axiosInstance.get<ApiResponse<UserProfileResponse>>(
      "/users/me"
    );
    return data.data;
  },

  async updateProfile(payload: UserUpdateRequest): Promise<UserProfileResponse> {
    const { data } = await axiosInstance.patch<ApiResponse<UserProfileResponse>>(
      "/users/me",
      payload
    );
    return data.data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await axiosInstance.post<ApiResponse<null>>(
      "/users/me/change-password",
      payload
    );
  },
};
