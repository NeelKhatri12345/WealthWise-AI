export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error" | "alert";
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  channel: "email" | "push" | "in_app";
  category: string;
  enabled: boolean;
}
