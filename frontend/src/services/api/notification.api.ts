import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationPreferencesResponse {
  email: boolean;
  push: boolean;
  budgetAlerts: boolean;
  transactionAlerts: boolean;
  weeklyReport: boolean;
  healthScoreAlerts: boolean;
}

export const notificationApi = {
  async getNotifications(): Promise<NotificationResponse[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<NotificationResponse[]>>(
        "/notifications",
      );
    return data.data;
  },

  async markRead(id: string): Promise<void> {
    await axiosInstance.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await axiosInstance.patch("/notifications/read-all");
  },

  async getPreferences(): Promise<NotificationPreferencesResponse> {
    const { data } = await axiosInstance.get<
      ApiResponse<NotificationPreferencesResponse>
    >("/notifications/preferences");
    return data.data;
  },

  async updatePreferences(
    prefs: Partial<NotificationPreferencesResponse>,
  ): Promise<NotificationPreferencesResponse> {
    const { data } = await axiosInstance.patch<
      ApiResponse<NotificationPreferencesResponse>
    >("/notifications/preferences", prefs);
    return data.data;
  },
};
